import { describe, it, expect, beforeEach } from "vitest"
import { truncateAll } from "../helpers/db"
import { createAccount, createPart } from "../helpers/fixtures"
import { mockRequest, mockGetRequest, mockParams } from "../helpers/api"

describe("Inventory API", () => {
  beforeEach(async () => {
    await truncateAll()
  })

  describe("POST /api/inventory", () => {
    it("creates a part", async () => {
      const { POST } = await import("../../app/api/inventory/route")
      const res = await POST(
        mockRequest({
          partName: "iPhone Screen",
          sku: "SCR-IP15",
          stockQty: 5,
          costPrice: "80",
          sellingPrice: "150",
        })
      )
      expect(res.status).toBe(201)
      const data = await res.json()
      expect(data.item.partName).toBe("iPhone Screen")
      expect(data.item.sku).toBe("SCR-IP15")
    })

    it("deducts from account when accountId and stock are provided", async () => {
      const account = await createAccount({ balance: "2000" })
      const { POST } = await import("../../app/api/inventory/route")
      const res = await POST(
        mockRequest({
          partName: "Battery",
          sku: "BAT-001",
          stockQty: 10,
          costPrice: "50",
          sellingPrice: "120",
          accountId: account.id,
        })
      )
      expect(res.status).toBe(201)
      const { db } = await import("@/db")
      const { accounts: accTable } = await import("../../db/schema")
      const { eq } = await import("drizzle-orm")
      const acc = await db.select().from(accTable).where(eq(accTable.id, account.id)).limit(1)
      expect(parseFloat(acc[0].balance)).toBe(1500)
    })

    it("does not deduct from account without accountId", async () => {
      const { POST } = await import("../../app/api/inventory/route")
      const res = await POST(
        mockRequest({
          partName: "Free Part",
          sku: "FREE-001",
          stockQty: 10,
          costPrice: "50",
          sellingPrice: "100",
        })
      )
      expect(res.status).toBe(201)
    })

    it("rejects duplicate SKU", async () => {
      const { POST } = await import("../../app/api/inventory/route")
      await POST(mockRequest({ partName: "A", sku: "DUP-SKU" }))
      const res = await POST(mockRequest({ partName: "B", sku: "DUP-SKU" }))
      expect(res.status).toBe(409)
    })

    it("rejects missing name and sku", async () => {
      const { POST } = await import("../../app/api/inventory/route")
      const res = await POST(mockRequest({}))
      expect(res.status).toBe(400)
    })
  })

  describe("GET /api/inventory", () => {
    it("lists inventory", async () => {
      await createPart({ partName: "Part A", sku: "A-001" })
      await createPart({ partName: "Part B", sku: "B-001" })
      const { GET } = await import("../../app/api/inventory/route")
      const res = await GET(mockGetRequest())
      const data = await res.json()
      expect(data.items.length).toBe(2)
    })
  })

  describe("GET /api/inventory/[id]", () => {
    it("gets by numeric id", async () => {
      const part = await createPart()
      const { GET } = await import("../../app/api/inventory/[id]/route")
      const res = await GET(mockGetRequest(), mockParams(String(part.id)))
      const data = await res.json()
      expect(data.item.id).toBe(part.id)
    })

    it("gets by SKU string", async () => {
      await createPart({ sku: "FIND-ME" })
      const { GET } = await import("../../app/api/inventory/[id]/route")
      const res = await GET(mockGetRequest(), mockParams("FIND-ME"))
      const data = await res.json()
      expect(data.item.sku).toBe("FIND-ME")
    })
  })

  describe("PUT /api/inventory/[id]", () => {
    it("updates part and deducts account for stock increase", async () => {
      const account = await createAccount({ balance: "1000" })
      const part = await createPart({
        stockQty: 5,
        costPrice: "50",
        accountId: account.id,
      })
      const { PUT } = await import("../../app/api/inventory/[id]/route")
      const res = await PUT(
        mockRequest({ stockQty: 10 }),
        mockParams(String(part.id))
      )
      expect(res.status).toBe(200)
      const { db } = await import("@/db")
      const { accounts: accTable } = await import("../../db/schema")
      const { eq } = await import("drizzle-orm")
      const acc = await db.select().from(accTable).where(eq(accTable.id, account.id)).limit(1)
      expect(parseFloat(acc[0].balance)).toBe(750)
    })
  })

  describe("DELETE /api/inventory/[id]", () => {
    it("deletes a part", async () => {
      const part = await createPart()
      const { DELETE } = await import("../../app/api/inventory/[id]/route")
      const res = await DELETE(mockGetRequest(), mockParams(String(part.id)))
      expect(res.status).toBe(200)
    })
  })
})
