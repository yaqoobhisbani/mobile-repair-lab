import { describe, it, expect, beforeEach } from "vitest"
import { truncateAll } from "../helpers/db"
import { createAccount } from "../helpers/fixtures"
import { mockRequest, mockGetRequest, mockParams } from "../helpers/api"

describe("Accounts API", () => {
  beforeEach(async () => {
    await truncateAll()
  })

  describe("POST /api/accounts", () => {
    it("creates an account", async () => {
      const { POST } = await import("../../app/api/accounts/route")
      const res = await POST(mockRequest({ name: "Cash Drawer", type: "cash" }))
      expect(res.status).toBe(201)
      const data = await res.json()
      expect(data.account.name).toBe("Cash Drawer")
      expect(data.account.type).toBe("cash")
    })

    it("creates account with opening balance and transaction", async () => {
      const { POST } = await import("../../app/api/accounts/route")
      const res = await POST(mockRequest({ name: "Bank Account", type: "bank", balance: "5000" }))
      expect(res.status).toBe(201)
      const data = await res.json()
      expect(parseFloat(data.account.balance)).toBe(5000)
      const { db } = await import("@/db")
      const { transactions } = await import("../../db/schema")
      const { eq } = await import("drizzle-orm")
      const txs = await db.select().from(transactions).where(eq(transactions.accountId, data.account.id))
      expect(txs.length).toBe(1)
      expect(txs[0].type).toBe("credit")
      expect(txs[0].referenceType).toBe("opening_balance")
    })

    it("rejects invalid type", async () => {
      const { POST } = await import("../../app/api/accounts/route")
      const res = await POST(mockRequest({ name: "Bad", type: "credit_card" }))
      expect(res.status).toBe(400)
    })

    it("rejects missing name", async () => {
      const { POST } = await import("../../app/api/accounts/route")
      const res = await POST(mockRequest({ type: "cash" }))
      expect(res.status).toBe(400)
    })
  })

  describe("GET /api/accounts", () => {
    it("lists accounts", async () => {
      await createAccount({ name: "A1" })
      await createAccount({ name: "A2" })
      const { GET } = await import("../../app/api/accounts/route")
      const res = await GET()
      const data = await res.json()
      expect(data.accounts.length).toBe(2)
    })
  })

  describe("GET /api/accounts/[id]", () => {
    it("gets account by id", async () => {
      const account = await createAccount()
      const { GET } = await import("../../app/api/accounts/[id]/route")
      const res = await GET(mockGetRequest(), mockParams(String(account.id)))
      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.account.id).toBe(account.id)
    })

    it("returns 404 for non-existent account", async () => {
      const { GET } = await import("../../app/api/accounts/[id]/route")
      const res = await GET(mockGetRequest(), mockParams("99999"))
      expect(res.status).toBe(404)
    })
  })

  describe("PUT /api/accounts/[id]", () => {
    it("updates account name and description", async () => {
      const account = await createAccount({ name: "Old Name" })
      const { PUT } = await import("../../app/api/accounts/[id]/route")
      const res = await PUT(mockRequest({ name: "New Name", description: "Updated desc" }), mockParams(String(account.id)))
      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.account.name).toBe("New Name")
      expect(data.account.description).toBe("Updated desc")
    })
  })

  describe("DELETE /api/accounts/[id]", () => {
    it("deletes unused account", async () => {
      const account = await createAccount({ name: "Delete Me" })
      const { DELETE } = await import("../../app/api/accounts/[id]/route")
      const res = await DELETE(mockGetRequest(), mockParams(String(account.id)))
      expect(res.status).toBe(200)
    })

    it("blocks deleting account with transactions", async () => {
      const account = await createAccount({ name: "Used Account", balance: "100" })
      const { db } = await import("@/db")
      const { transactions } = await import("../../db/schema")
      await db.insert(transactions).values({
        accountId: account.id,
        type: "credit",
        amount: "50",
        description: "Test tx",
        referenceType: "opening_balance",
      })
      const { DELETE } = await import("../../app/api/accounts/[id]/route")
      const res = await DELETE(mockGetRequest(), mockParams(String(account.id)))
      expect(res.status).toBe(400)
      const data = await res.json()
      expect(data.error).toContain("transaction")
    })
  })
})
