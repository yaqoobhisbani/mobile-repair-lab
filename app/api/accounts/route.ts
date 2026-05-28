import { NextResponse } from "next/server"
import { db } from "@/db"
import { accounts } from "@/db/schema"
import { desc } from "drizzle-orm"
import { insertTransaction } from "@/db/transactions"

export async function GET() {
  try {
    const items = await db
      .select()
      .from(accounts)
      .orderBy(desc(accounts.id))

    return NextResponse.json({ accounts: items })
  } catch {
    return NextResponse.json({ error: "Failed to fetch accounts" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, type, balance, description } = body

    if (!name?.trim() || !type) {
      return NextResponse.json({ error: "Name and type are required" }, { status: 400 })
    }

    if (!["bank", "cash"].includes(type)) {
      return NextResponse.json({ error: "Invalid account type" }, { status: 400 })
    }

    const account = await db.transaction(async (tx) => {
      const [a] = await tx
        .insert(accounts)
        .values({
          name: name.trim(),
          type,
          balance: balance ? String(balance) : "0",
          description: description?.trim() || null,
        })
        .returning()

      const initialBalance = parseFloat(balance || "0")
      if (initialBalance > 0) {
        await insertTransaction(
          a.id,
          "credit",
          initialBalance,
          "Opening balance",
          "opening_balance",
          undefined,
          tx
        )
      }

      return a
    })

    return NextResponse.json({ account }, { status: 201 })
  } catch {
    return NextResponse.json({ error: "Failed to create account" }, { status: 500 })
  }
}
