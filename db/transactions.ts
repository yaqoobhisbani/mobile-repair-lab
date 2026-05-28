import { db } from "./index"
import { transactions } from "./schema"

export async function insertTransaction(
  accountId: number,
  type: "credit" | "debit",
  amount: number,
  description: string,
  referenceType: "ticket" | "expense" | "opening_balance",
  referenceId?: string
) {
  await db.insert(transactions).values({
    accountId,
    type,
    amount: String(amount),
    description,
    referenceType,
    referenceId,
  })
}
