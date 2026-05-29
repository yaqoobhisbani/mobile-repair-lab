import { NextResponse } from "next/server"
import { db } from "@/db"
import { accounts, transactions, expenses, tickets, saleOrders, inventory } from "@/db/schema"
import { eq, sql } from "drizzle-orm"

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
    const { name, type, description } = body

    if (type && !["bank", "cash"].includes(type)) {
      return NextResponse.json({ error: "Invalid account type" }, { status: 400 })
    }

    const updateData: Record<string, any> = {
      name: name?.trim() || undefined,
      type: type || undefined,
      description: description !== undefined ? (description?.trim() || null) : undefined,
    }

    const [account] = await db
      .update(accounts)
      .set(updateData)
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

    const [txCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(transactions)
      .where(eq(transactions.accountId, numericId))

    if (txCount && txCount.count > 0) {
      return NextResponse.json(
        { error: `Cannot delete account: ${txCount.count} transaction(s) reference this account.` },
        { status: 400 }
      )
    }

    const [expenseCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(expenses)
      .where(eq(expenses.accountId, numericId))

    if (expenseCount && expenseCount.count > 0) {
      return NextResponse.json(
        { error: `Cannot delete account: ${expenseCount.count} expense(s) reference this account.` },
        { status: 400 }
      )
    }

    const [ticketCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(tickets)
      .where(eq(tickets.paymentAccountId, numericId))

    if (ticketCount && ticketCount.count > 0) {
      return NextResponse.json(
        { error: `Cannot delete account: ${ticketCount.count} ticket(s) reference this account.` },
        { status: 400 }
      )
    }

    const [saleCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(saleOrders)
      .where(eq(saleOrders.paymentAccountId, numericId))

    if (saleCount && saleCount.count > 0) {
      return NextResponse.json(
        { error: `Cannot delete account: ${saleCount.count} sale(s) reference this account.` },
        { status: 400 }
      )
    }

    const [invCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(inventory)
      .where(eq(inventory.accountId, numericId))

    if (invCount && invCount.count > 0) {
      return NextResponse.json(
        { error: `Cannot delete account: ${invCount.count} inventory item(s) reference this account.` },
        { status: 400 }
      )
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
