import { NextResponse } from "next/server"
import { db } from "@/db"
import { accounts } from "@/db/schema"
import { eq, sql } from "drizzle-orm"
import { insertTransaction } from "@/db/transactions"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const sourceId = Number(id)

    if (isNaN(sourceId)) {
      return NextResponse.json({ error: "Invalid account ID" }, { status: 400 })
    }

    const body = await request.json()
    const { toAccountId, amount: rawAmount, description } = body
    const destId = Number(toAccountId)

    if (isNaN(destId)) {
      return NextResponse.json({ error: "Invalid destination account ID" }, { status: 400 })
    }

    if (sourceId === destId) {
      return NextResponse.json({ error: "Cannot transfer to the same account" }, { status: 400 })
    }

    const amount = parseFloat(rawAmount)
    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Amount must be greater than 0" }, { status: 400 })
    }

    const [source] = await db
      .select()
      .from(accounts)
      .where(eq(accounts.id, sourceId))
      .limit(1)

    if (!source) {
      return NextResponse.json({ error: "Source account not found" }, { status: 404 })
    }

    const [destination] = await db
      .select()
      .from(accounts)
      .where(eq(accounts.id, destId))
      .limit(1)

    if (!destination) {
      return NextResponse.json({ error: "Destination account not found" }, { status: 404 })
    }

    const currentBalance = parseFloat(source.balance)
    if (currentBalance < amount) {
      return NextResponse.json({ error: "Insufficient balance in source account" }, { status: 400 })
    }

    const updated = await db.transaction(async (tx) => {
      const [debited] = await tx
        .update(accounts)
        .set({ balance: sql`${accounts.balance} - ${amount}` })
        .where(eq(accounts.id, sourceId))
        .returning()

      await insertTransaction(
        sourceId,
        "debit",
        amount,
        description?.trim() || `Transfer to ${destination.name}`,
        "transfer",
        String(destId),
        tx
      )

      const [credited] = await tx
        .update(accounts)
        .set({ balance: sql`${accounts.balance} + ${amount}` })
        .where(eq(accounts.id, destId))
        .returning()

      await insertTransaction(
        destId,
        "credit",
        amount,
        description?.trim() || `Transfer from ${source.name}`,
        "transfer",
        String(sourceId),
        tx
      )

      return { source: debited, destination: credited }
    })

    return NextResponse.json(updated)
  } catch {
    return NextResponse.json({ error: "Failed to process transfer" }, { status: 500 })
  }
}
