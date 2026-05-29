import { describe, it, expect, beforeEach } from "vitest"
import { truncateAll } from "../helpers/db"
import { createCustomer, createAccount, createPart } from "../helpers/fixtures"
import { mockRequest, mockGetRequest, mockParams } from "../helpers/api"

describe("Sales API", () => {
  beforeEach(async () => {
    await truncateAll()
  })

  describe("POST /api/sales", () => {
    it("creates a sale, deducts stock, and credits account", async () => {
      const account = await createAccount({ balance: "500" })
      const part = await createPart({ stockQty: 10, sellingPrice: "100", costPrice: "50" })
      const { POST } = await import("../../app/api/sales/route")
      const res = await POST(
        mockRequest({
          items: [{ inventoryId: part.id, quantity: 3 }],
          paymentAccountId: account.id,
        })
      )
      expect(res.status).toBe(201)
      const data = await res.json()
      expect(data.sale.id).toMatch(/^SALE-/)
      const { db } = await import("@/db")
      const { inventory: invTable, accounts: accTable } = await import("../../db/schema")
      const { eq } = await import("drizzle-orm")
      const updatedPart = await db.select().from(invTable).where(eq(invTable.id, part.id)).limit(1)
      expect(updatedPart[0].stockQty).toBe(7)
      const updatedAcc = await db.select().from(accTable).where(eq(accTable.id, account.id)).limit(1)
      expect(parseFloat(updatedAcc[0].balance)).toBe(800)
    })

    it("creates sale with customer reference", async () => {
      const customer = await createCustomer({ name: "Sale Buyer", phone: "555-9999" })
      const account = await createAccount({ balance: "1000" })
      const part = await createPart({ stockQty: 5, sellingPrice: "200" })
      const { POST } = await import("../../app/api/sales/route")
      const res = await POST(
        mockRequest({
          items: [{ inventoryId: part.id, quantity: 1 }],
          paymentAccountId: account.id,
          customerId: customer.id,
        })
      )
      expect(res.status).toBe(201)
      const data = await res.json()
      expect(data.sale.customerName).toBe("Sale Buyer")
    })

    it("rejects missing items", async () => {
      const { POST } = await import("../../app/api/sales/route")
      const res = await POST(mockRequest({ items: [], paymentAccountId: 1 }))
      expect(res.status).toBe(400)
    })

    it("rejects insufficient stock", async () => {
      const account = await createAccount()
      const part = await createPart({ stockQty: 1 })
      const { POST } = await import("../../app/api/sales/route")
      const res = await POST(
        mockRequest({
          items: [{ inventoryId: part.id, quantity: 10 }],
          paymentAccountId: account.id,
        })
      )
      expect(res.status).toBe(500)
    })
  })

  describe("GET /api/sales", () => {
    it("lists sales", async () => {
      const account = await createAccount()
      const part = await createPart({ stockQty: 5 })
      const { POST } = await import("../../app/api/sales/route")
      await POST(
        mockRequest({
          items: [{ inventoryId: part.id, quantity: 1 }],
          paymentAccountId: account.id,
        })
      )
      const { GET } = await import("../../app/api/sales/route")
      const res = await GET(mockGetRequest())
      const data = await res.json()
      expect(data.sales.length).toBe(1)
    })
  })

  describe("GET /api/sales/[id]", () => {
    it("gets sale with items", async () => {
      const account = await createAccount()
      const part = await createPart({ stockQty: 5 })
      const { POST } = await import("../../app/api/sales/route")
      const createRes = await POST(
        mockRequest({
          items: [{ inventoryId: part.id, quantity: 2 }],
          paymentAccountId: account.id,
        })
      )
      const { sale } = await createRes.json()
      const { GET } = await import("../../app/api/sales/[id]/route")
      const res = await GET(mockGetRequest(), mockParams(sale.id))
      const data = await res.json()
      expect(data.sale.id).toBe(sale.id)
      expect(data.items.length).toBe(1)
    })
  })

  describe("DELETE /api/sales/[id]", () => {
    it("deletes sale, restores stock, and debits account", async () => {
      const account = await createAccount({ balance: "1000" })
      const part = await createPart({ stockQty: 10, sellingPrice: "100" })
      const { POST } = await import("../../app/api/sales/route")
      const createRes = await POST(
        mockRequest({
          items: [{ inventoryId: part.id, quantity: 3 }],
          paymentAccountId: account.id,
        })
      )
      const { sale } = await createRes.json()
      const { DELETE } = await import("../../app/api/sales/[id]/route")
      const delRes = await DELETE(mockGetRequest(), mockParams(sale.id))
      expect(delRes.status).toBe(200)
      const { db } = await import("@/db")
      const { inventory: invTable, accounts: accTable } = await import("../../db/schema")
      const { eq } = await import("drizzle-orm")
      const afterPart = await db.select().from(invTable).where(eq(invTable.id, part.id)).limit(1)
      expect(afterPart[0].stockQty).toBe(10)
      const afterAcc = await db.select().from(accTable).where(eq(accTable.id, account.id)).limit(1)
      expect(parseFloat(afterAcc[0].balance)).toBe(1000)
    })
  })
})
