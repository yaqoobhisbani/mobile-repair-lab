import { db } from "./index"
import { transactions } from "./schema"

export async function insertTransaction(
  accountId: number,
  type: "credit" | "debit",
  amount: number,
  description: string,
  referenceType: "ticket" | "expense" | "opening_balance" | "top_up" | "sale" | "transfer" | "inventory_purchase",
  referenceId?: string,
  tx?: any
) {
  const conn = tx ?? db
  await conn.insert(transactions).values({
    accountId,
    type,
    amount: String(amount),
    description,
    referenceType,
    referenceId,
  })
}
