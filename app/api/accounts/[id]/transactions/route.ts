import { NextResponse } from "next/server"
import { db } from "@/db"
import { transactions, accounts } from "@/db/schema"
import { eq, desc } from "drizzle-orm"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const numericId = Number(id)

    if (isNaN(numericId)) {
      return NextResponse.json({ error: "Invalid account ID" }, { status: 400 })
    }

    const [account] = await db
      .select()
      .from(accounts)
      .where(eq(accounts.id, numericId))
      .limit(1)

    if (!account) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 })
    }

    const items = await db
      .select()
      .from(transactions)
      .where(eq(transactions.accountId, numericId))
      .orderBy(desc(transactions.createdAt))

    return NextResponse.json({ account, transactions: items })
  } catch {
    return NextResponse.json({ error: "Failed to fetch transactions" }, { status: 500 })
  }
}
