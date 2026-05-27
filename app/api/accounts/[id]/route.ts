import { NextResponse } from "next/server"
import { db } from "@/db"
import { accounts } from "@/db/schema"
import { eq } from "drizzle-orm"

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

    return NextResponse.json({ account })
  } catch {
    return NextResponse.json({ error: "Failed to fetch account" }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const numericId = Number(id)

    if (isNaN(numericId)) {
      return NextResponse.json({ error: "Invalid account ID" }, { status: 400 })
    }

    const body = await request.json()
    const { name, type, balance, description } = body

    if (type && !["bank", "cash", "wallet"].includes(type)) {
      return NextResponse.json({ error: "Invalid account type" }, { status: 400 })
    }

    const [account] = await db
      .update(accounts)
      .set({
        name: name?.trim() || undefined,
        type: type || undefined,
        balance: balance !== undefined ? String(balance) : undefined,
        description: description !== undefined ? (description?.trim() || null) : undefined,
      })
      .where(eq(accounts.id, numericId))
      .returning()

    if (!account) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 })
    }

    return NextResponse.json({ account })
  } catch {
    return NextResponse.json({ error: "Failed to update account" }, { status: 500 })
  }
}

export async function DELETE(
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
      .delete(accounts)
      .where(eq(accounts.id, numericId))
      .returning()

    if (!account) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Failed to delete account" }, { status: 500 })
  }
}
