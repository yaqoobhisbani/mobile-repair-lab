import { NextResponse } from "next/server"
import { db } from "@/db"
import { ticketItems, inventory, tickets, accounts } from "@/db/schema"
import { eq, and, sql } from "drizzle-orm"
import { insertTransaction } from "@/db/transactions"

async function recalcAndSync(
  tx: any,
  ticketId: string,
  ticket: { paymentStatus: string; amountPaid: string; paymentAccountId: number | null; laborCost: string | null; discountType: string | null; discountValue: string | null },
) {
  if (ticket.paymentStatus !== "paid") return

  const allItems = await tx
    .select({
      sellingPrice: inventory.sellingPrice,
      quantityUsed: ticketItems.quantityUsed,
    })
    .from(ticketItems)
    .leftJoin(inventory, eq(ticketItems.inventoryId, inventory.id))
    .where(eq(ticketItems.ticketId, ticketId))

  const partsTotal = allItems.reduce(
    (sum, item) => sum + (parseFloat(item.sellingPrice ?? "0") * item.quantityUsed),
    0,
  )
  const labor = parseFloat(ticket.laborCost ?? "0")
  const subtotal = partsTotal + labor

  let discountAmount = 0
  if (ticket.discountType === "percentage" && ticket.discountValue) {
    discountAmount = subtotal * parseFloat(ticket.discountValue) / 100
  } else if (ticket.discountType === "amount" && ticket.discountValue) {
    discountAmount = parseFloat(ticket.discountValue)
  }
  const totalAmount = Math.max(0, subtotal - discountAmount)
  const oldPaid = parseFloat(ticket.amountPaid ?? "0")
  const difference = totalAmount - oldPaid

  if (difference === 0) return

  await tx
    .update(tickets)
    .set({ amountPaid: String(totalAmount) })
    .where(eq(tickets.id, ticketId))

  if (ticket.paymentAccountId) {
    const absDiff = Math.abs(difference)
    if (difference > 0) {
      await tx
        .update(accounts)
        .set({ balance: sql`${accounts.balance} + ${absDiff}` })
        .where(eq(accounts.id, ticket.paymentAccountId))
      await insertTransaction(
        ticket.paymentAccountId,
        "credit",
        absDiff,
        `Auto-adjustment for added parts on Ticket ${ticketId}`,
        "ticket",
        ticketId,
        tx,
      )
    } else {
      await tx
        .update(accounts)
        .set({ balance: sql`${accounts.balance} - ${absDiff}` })
        .where(eq(accounts.id, ticket.paymentAccountId))
      await insertTransaction(
        ticket.paymentAccountId,
        "debit",
        absDiff,
        `Auto-adjustment for removed parts on Ticket ${ticketId}`,
        "ticket",
        ticketId,
        tx,
      )
    }
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { inventoryId, quantityUsed } = body

    if (!inventoryId || !quantityUsed || quantityUsed < 1) {
      return NextResponse.json({ error: "Part and quantity are required" }, { status: 400 })
    }

    const [part] = await db
      .select()
      .from(inventory)
      .where(eq(inventory.id, inventoryId))
      .limit(1)

    if (!part) {
      return NextResponse.json({ error: "Part not found" }, { status: 404 })
    }

    if (part.stockQty < quantityUsed) {
      return NextResponse.json(
        { error: `Insufficient stock. Only ${part.stockQty} available.` },
        { status: 400 }
      )
    }

    const [existing] = await db
      .select()
      .from(ticketItems)
      .where(
        and(
          eq(ticketItems.ticketId, id),
          eq(ticketItems.inventoryId, inventoryId)
        )
      )
      .limit(1)

    const [ticket] = await db
      .select({
        paymentStatus: tickets.paymentStatus,
        amountPaid: tickets.amountPaid,
        paymentAccountId: tickets.paymentAccountId,
        laborCost: tickets.laborCost,
        discountType: tickets.discountType,
        discountValue: tickets.discountValue,
      })
      .from(tickets)
      .where(eq(tickets.id, id))
      .limit(1)

    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 })
    }

    let item
    if (existing) {
      const newQty = existing.quantityUsed + quantityUsed
      if (part.stockQty < newQty) {
        return NextResponse.json(
          { error: `Insufficient stock. Only ${part.stockQty} available (${existing.quantityUsed} already on this ticket).` },
          { status: 400 }
        )
      }
      item = await db.transaction(async (tx) => {
        const [i] = await tx
          .update(ticketItems)
          .set({ quantityUsed: newQty })
          .where(eq(ticketItems.id, existing.id))
          .returning()
        await tx
          .update(inventory)
          .set({ stockQty: sql`${inventory.stockQty} - ${quantityUsed}` })
          .where(eq(inventory.id, inventoryId))

        await recalcAndSync(tx, id, ticket)

        return i
      })
    } else {
      item = await db.transaction(async (tx) => {
        const [i] = await tx
          .insert(ticketItems)
          .values({
            ticketId: id,
            inventoryId,
            quantityUsed,
          })
          .returning()
        await tx
          .update(inventory)
          .set({ stockQty: sql`${inventory.stockQty} - ${quantityUsed}` })
          .where(eq(inventory.id, inventoryId))

        await recalcAndSync(tx, id, ticket)

        return i
      })
    }

    return NextResponse.json({ item }, { status: 201 })
  } catch {
    return NextResponse.json({ error: "Failed to add part" }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { itemId } = body

    if (!itemId) {
      return NextResponse.json({ error: "Item ID is required" }, { status: 400 })
    }

    const [item] = await db
      .select()
      .from(ticketItems)
      .where(
        and(
          eq(ticketItems.id, itemId),
          eq(ticketItems.ticketId, id)
        )
      )
      .limit(1)

    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 })
    }

    const [ticket] = await db
      .select({
        paymentStatus: tickets.paymentStatus,
        amountPaid: tickets.amountPaid,
        paymentAccountId: tickets.paymentAccountId,
        laborCost: tickets.laborCost,
        discountType: tickets.discountType,
        discountValue: tickets.discountValue,
      })
      .from(tickets)
      .where(eq(tickets.id, id))
      .limit(1)

    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 })
    }

    await db.transaction(async (tx) => {
      await tx
        .update(inventory)
        .set({ stockQty: sql`${inventory.stockQty} + ${item.quantityUsed}` })
        .where(eq(inventory.id, item.inventoryId))

      await tx
        .delete(ticketItems)
        .where(eq(ticketItems.id, itemId))

      await recalcAndSync(tx, id, ticket)
    })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Failed to remove part" }, { status: 500 })
  }
}
