import { describe, it, expect, beforeEach } from "vitest"
import { truncateAll } from "../helpers/db"
import { createAccount } from "../helpers/fixtures"
import { mockRequest, mockParams } from "../helpers/api"

describe("Account Transfer API", () => {
  beforeEach(async () => {
    await truncateAll()
  })

  it("transfers amount between accounts and records transactions", async () => {
    const source = await createAccount({ name: "Source", balance: "1000" })
    const dest = await createAccount({ name: "Dest", balance: "500" })
    const { POST } = await import("../../app/api/accounts/[id]/transfer/route")
    const res = await POST(
      mockRequest({ toAccountId: dest.id, amount: "300", description: "Transfer" }),
      mockParams(String(source.id))
    )
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(parseFloat(data.source.balance)).toBe(700)
    expect(parseFloat(data.destination.balance)).toBe(800)
    const { db } = await import("@/db")
    const { transactions } = await import("../../db/schema")
    const { eq, or } = await import("drizzle-orm")
    const txs = await db
      .select()
      .from(transactions)
      .where(or(eq(transactions.accountId, source.id), eq(transactions.accountId, dest.id)))
    expect(txs.length).toBe(2)
    const sourceTx = txs.find((t: { accountId: number }) => t.accountId === source.id)
    const destTx = txs.find((t: { accountId: number }) => t.accountId === dest.id)
    expect(sourceTx.type).toBe("debit")
    expect(destTx.type).toBe("credit")
  })

  it("rejects transfer to same account", async () => {
    const source = await createAccount({ balance: "1000" })
    const { POST } = await import("../../app/api/accounts/[id]/transfer/route")
    const res = await POST(
      mockRequest({ toAccountId: source.id, amount: "100" }),
      mockParams(String(source.id))
    )
    expect(res.status).toBe(400)
  })

  it("rejects insufficient balance", async () => {
    const source = await createAccount({ balance: "50" })
    const dest = await createAccount()
    const { POST } = await import("../../app/api/accounts/[id]/transfer/route")
    const res = await POST(
      mockRequest({ toAccountId: dest.id, amount: "500" }),
      mockParams(String(source.id))
    )
    expect(res.status).toBe(400)
  })
})
