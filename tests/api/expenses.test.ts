import { describe, it, expect, beforeEach } from "vitest"
import { truncateAll } from "../helpers/db"
import { createAccount } from "../helpers/fixtures"
import { mockRequest, mockGetRequest, mockParams } from "../helpers/api"

describe("Expenses API", () => {
  beforeEach(async () => {
    await truncateAll()
  })

  describe("POST /api/expenses", () => {
    it("creates expense and deducts from account", async () => {
      const account = await createAccount({ balance: "500" })
      const { POST } = await import("../../app/api/expenses/route")
      const res = await POST(
        mockRequest({
          description: "Office supplies",
          amount: "100",
          accountId: account.id,
        })
      )
      expect(res.status).toBe(201)
      const data = await res.json()
      expect(data.expense.description).toBe("Office supplies")
      expect(parseFloat(data.expense.amount)).toBe(100)
      const { db } = await import("@/db")
      const { accounts: accTable } = await import("../../db/schema")
      const { eq } = await import("drizzle-orm")
      const acc = await db.select().from(accTable).where(eq(accTable.id, account.id)).limit(1)
      expect(parseFloat(acc[0].balance)).toBe(400)
    })

    it("rejects insufficient balance", async () => {
      const account = await createAccount({ balance: "50" })
      const { POST } = await import("../../app/api/expenses/route")
      const res = await POST(
        mockRequest({
          description: "Big expense",
          amount: "200",
          accountId: account.id,
        })
      )
      expect(res.status).toBe(400)
    })

    it("rejects missing fields", async () => {
      const { POST } = await import("../../app/api/expenses/route")
      const res = await POST(mockRequest({}))
      expect(res.status).toBe(400)
    })

    it("rejects non-positive amount", async () => {
      const account = await createAccount()
      const { POST } = await import("../../app/api/expenses/route")
      const res = await POST(
        mockRequest({
          description: "Free stuff",
          amount: "0",
          accountId: account.id,
        })
      )
      expect(res.status).toBe(400)
    })
  })

  describe("GET /api/expenses", () => {
    it("lists expenses", async () => {
      const account = await createAccount({ balance: "1000" })
      const { POST } = await import("../../app/api/expenses/route")
      await POST(
        mockRequest({ description: "E1", amount: "50", accountId: account.id })
      )
      await POST(
        mockRequest({ description: "E2", amount: "75", accountId: account.id })
      )
      const { GET } = await import("../../app/api/expenses/route")
      const res = await GET()
      const data = await res.json()
      expect(data.expenses.length).toBe(2)
    })
  })

  describe("DELETE /api/expenses/[id]", () => {
    it("deletes expense and restores account balance", async () => {
      const account = await createAccount({ balance: "1000" })
      const { POST } = await import("../../app/api/expenses/route")
      const createRes = await POST(
        mockRequest({ description: "Refundable", amount: "200", accountId: account.id })
      )
      const { expense } = await createRes.json()
      const { DELETE } = await import("../../app/api/expenses/[id]/route")
      const delRes = await DELETE(mockGetRequest(), mockParams(String(expense.id)))
      expect(delRes.status).toBe(200)
      const { db } = await import("@/db")
      const { accounts: accTable } = await import("../../db/schema")
      const { eq } = await import("drizzle-orm")
      const acc = await db.select().from(accTable).where(eq(accTable.id, account.id)).limit(1)
      expect(parseFloat(acc[0].balance)).toBe(1000)
    })

    it("returns 404 for non-existent expense", async () => {
      const { DELETE } = await import("../../app/api/expenses/[id]/route")
      const res = await DELETE(mockGetRequest(), mockParams("99999"))
      expect(res.status).toBe(404)
    })
  })
})
