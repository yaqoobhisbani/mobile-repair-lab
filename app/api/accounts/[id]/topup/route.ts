import { NextResponse } from "next/server"
import { db } from "@/db"
import { accounts } from "@/db/schema"
import { eq } from "drizzle-orm"
import { insertTransaction } from "@/db/transactions"

export async function POST(
  request: Request,
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

    const body = await request.json()
    const amount = parseFloat(body.amount)

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Amount must be greater than 0" }, { status: 400 })
    }

    const newBalance = parseFloat(account.balance) + amount

    const [updated] = await db
      .update(accounts)
      .set({ balance: String(newBalance) })
      .where(eq(accounts.id, numericId))
      .returning()

    await insertTransaction(
      numericId,
      "credit",
      amount,
      body.description?.trim() || "Account top-up",
      "top_up"
    )

    return NextResponse.json({ account: updated })
  } catch {
    return NextResponse.json({ error: "Failed to top up account" }, { status: 500 })
  }
}
