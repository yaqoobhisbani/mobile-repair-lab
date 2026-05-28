import { NextResponse } from "next/server"
import { db } from "@/db"
import { expenses, accounts } from "@/db/schema"
import { eq, sql } from "drizzle-orm"
import { insertTransaction } from "@/db/transactions"

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const numericId = Number(id)

    if (isNaN(numericId)) {
      return NextResponse.json({ error: "Invalid expense ID" }, { status: 400 })
    }

    const [expense] = await db
      .select()
      .from(expenses)
      .where(eq(expenses.id, numericId))
      .limit(1)

    if (!expense) {
      return NextResponse.json({ error: "Expense not found" }, { status: 404 })
    }

    const amount = parseFloat(expense.amount ?? "0")

    await db
      .update(accounts)
      .set({ balance: sql`${accounts.balance} + ${amount}` })
      .where(eq(accounts.id, expense.accountId))

    await insertTransaction(
      expense.accountId,
      "credit",
      amount,
      `Expense deleted: ${expense.description}`,
      "expense",
      String(numericId)
    )

    await db.delete(expenses).where(eq(expenses.id, numericId))

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Failed to delete expense" }, { status: 500 })
  }
}
