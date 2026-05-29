import { describe, it, expect, beforeEach } from "vitest"
import { truncateAll } from "../helpers/db"
import { createAccount } from "../helpers/fixtures"
import { mockRequest, mockParams } from "../helpers/api"

describe("Account Top-up API", () => {
  beforeEach(async () => {
    await truncateAll()
  })

  it("credits the account and records transaction", async () => {
    const account = await createAccount({ balance: "100" })
    const { POST } = await import("../../app/api/accounts/[id]/topup/route")
    const res = await POST(
      mockRequest({ amount: "200", description: "Weekly top-up" }),
      mockParams(String(account.id))
    )
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(parseFloat(data.account.balance)).toBe(300)
    const { db } = await import("@/db")
    const { transactions } = await import("../../db/schema")
    const { eq } = await import("drizzle-orm")
    const txs = await db
      .select()
      .from(transactions)
      .where(eq(transactions.accountId, account.id))
    expect(txs.length).toBe(1)
    expect(txs[0].type).toBe("credit")
    expect(txs[0].referenceType).toBe("top_up")
  })

  it("rejects non-positive amount", async () => {
    const account = await createAccount()
    const { POST } = await import("../../app/api/accounts/[id]/topup/route")
    const res = await POST(mockRequest({ amount: "0" }), mockParams(String(account.id)))
    expect(res.status).toBe(400)
  })

  it("returns 404 for non-existent account", async () => {
    const { POST } = await import("../../app/api/accounts/[id]/topup/route")
    const res = await POST(mockRequest({ amount: "100" }), mockParams("99999"))
    expect(res.status).toBe(404)
  })
})
