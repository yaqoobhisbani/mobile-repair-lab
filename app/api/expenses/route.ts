import { NextResponse } from "next/server"
import { db } from "@/db"
import { expenses, accounts } from "@/db/schema"
import { eq, desc, sql } from "drizzle-orm"
import { insertTransaction } from "@/db/transactions"

export async function GET() {
  try {
    const items = await db
      .select({
        id: expenses.id,
        description: expenses.description,
        amount: expenses.amount,
        category: expenses.category,
        accountId: expenses.accountId,
        accountName: accounts.name,
        date: expenses.date,
        createdAt: expenses.createdAt,
      })
      .from(expenses)
      .leftJoin(accounts, eq(expenses.accountId, accounts.id))
      .orderBy(desc(expenses.date))

    return NextResponse.json({ expenses: items })
  } catch {
    return NextResponse.json({ error: "Failed to fetch expenses" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { description, amount, category, accountId, date } = body

    if (!description?.trim() || !amount || !accountId) {
      return NextResponse.json({ error: "Description, amount, and account are required" }, { status: 400 })
    }

    const parsedAmount = parseFloat(amount)
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json({ error: "Amount must be a positive number" }, { status: 400 })
    }

    const numericAccountId = Number(accountId)
    if (isNaN(numericAccountId)) {
      return NextResponse.json({ error: "Invalid account" }, { status: 400 })
    }

    const [account] = await db
      .select({ balance: accounts.balance })
      .from(accounts)
      .where(eq(accounts.id, numericAccountId))
      .limit(1)

    if (!account) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 })
    }

    const currentBalance = parseFloat(account.balance ?? "0")
    if (currentBalance < parsedAmount) {
      return NextResponse.json({
        error: `Insufficient balance in ${body.accountName || "account"}. Available: Rs. ${currentBalance.toFixed(2)}`
      }, { status: 400 })
    }

    const expense = await db.transaction(async (tx) => {
      await tx
        .update(accounts)
        .set({ balance: sql`${accounts.balance} - ${parsedAmount}` })
        .where(eq(accounts.id, numericAccountId))

      const [e] = await tx
        .insert(expenses)
        .values({
          description: description.trim(),
          amount: String(parsedAmount),
          category: category?.trim() || null,
          accountId: numericAccountId,
          date: date ? new Date(date) : new Date(),
        })
        .returning()

      await insertTransaction(
        numericAccountId,
        "debit",
        parsedAmount,
        `Expense: ${description.trim()}`,
        "expense",
        String(e.id),
        tx
      )

      return e
    })

    return NextResponse.json({ expense }, { status: 201 })
  } catch {
    return NextResponse.json({ error: "Failed to create expense" }, { status: 500 })
  }
}
