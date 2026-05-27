import { NextResponse } from "next/server"
import { db } from "@/db"
import { tickets, customers, ticketItems, inventory, accounts } from "@/db/schema"
import { eq, sql } from "drizzle-orm"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const [ticket] = await db
      .select({
        id: tickets.id,
        customerId: tickets.customerId,
        customerName: customers.name,
        customerPhone: customers.phone,
        customerEmail: customers.email,
        brand: tickets.brand,
        model: tickets.model,
        imei: tickets.imei,
        passcode: tickets.passcode,
        problemCategory: tickets.problemCategory,
        problemDescription: tickets.problemDescription,
        status: tickets.status,
        paymentStatus: tickets.paymentStatus,
        paymentAccountId: tickets.paymentAccountId,
        paymentAccountName: accounts.name,
        laborCost: tickets.laborCost,
        estimatedCompletion: tickets.estimatedCompletion,
        createdAt: tickets.createdAt,
      })
      .from(tickets)
      .leftJoin(customers, eq(tickets.customerId, customers.id))
      .leftJoin(accounts, eq(tickets.paymentAccountId, accounts.id))
      .where(eq(tickets.id, id))
      .limit(1)

    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 })
    }

    const items = await db
      .select({
        id: ticketItems.id,
        inventoryId: ticketItems.inventoryId,
        partName: inventory.partName,
        sku: inventory.sku,
        quantityUsed: ticketItems.quantityUsed,
        sellingPrice: inventory.sellingPrice,
      })
      .from(ticketItems)
      .leftJoin(inventory, eq(ticketItems.inventoryId, inventory.id))
      .where(eq(ticketItems.ticketId, id))

    return NextResponse.json({ ticket, items })
  } catch {
    return NextResponse.json({ error: "Failed to fetch ticket" }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { status, estimatedCompletion, problemDescription, laborCost, imei, passcode, paymentStatus, paymentAccountId } = body

    const [current] = await db
      .select({
        paymentStatus: tickets.paymentStatus,
        paymentAccountId: tickets.paymentAccountId,
        laborCost: tickets.laborCost,
      })
      .from(tickets)
      .where(eq(tickets.id, id))
      .limit(1)

    if (!current) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 })
    }

    const updateData: Record<string, any> = {}
    if (status) updateData.status = status
    if (estimatedCompletion !== undefined) {
      updateData.estimatedCompletion = estimatedCompletion ? new Date(estimatedCompletion) : null
    }
    if (problemDescription !== undefined) updateData.problemDescription = problemDescription
    if (laborCost !== undefined) updateData.laborCost = laborCost ? String(laborCost) : null
    if (imei !== undefined) updateData.imei = imei
    if (passcode !== undefined) updateData.passcode = passcode
    if (paymentStatus !== undefined) updateData.paymentStatus = paymentStatus
    if (paymentAccountId !== undefined) {
      updateData.paymentAccountId = paymentAccountId ? Number(paymentAccountId) : null
    }

    const [ticket] = await db
      .update(tickets)
      .set(updateData)
      .where(eq(tickets.id, id))
      .returning()

    const newPaymentStatus = paymentStatus ?? current.paymentStatus
    const newAccountId = paymentAccountId !== undefined
      ? (paymentAccountId ? Number(paymentAccountId) : null)
      : current.paymentAccountId

    const paidChanged = paymentStatus !== undefined && newPaymentStatus !== current.paymentStatus
    const accountChanged = paymentAccountId !== undefined && newAccountId !== current.paymentAccountId

    if (paidChanged || accountChanged) {
      const items = await db
        .select({
          sellingPrice: inventory.sellingPrice,
          quantityUsed: ticketItems.quantityUsed,
        })
        .from(ticketItems)
        .leftJoin(inventory, eq(ticketItems.inventoryId, inventory.id))
        .where(eq(ticketItems.ticketId, id))

      const partsTotal = items.reduce(
        (sum, item) => sum + (parseFloat(item.sellingPrice ?? "0") * item.quantityUsed),
        0
      )
      const labor = parseFloat(current.laborCost ?? "0")
      const totalAmount = partsTotal + labor

      if (totalAmount > 0) {
        if (current.paymentStatus === "paid" && current.paymentAccountId) {
          await db
            .update(accounts)
            .set({ balance: sql`${accounts.balance} - ${totalAmount}` })
            .where(eq(accounts.id, current.paymentAccountId))
        }

        if (newPaymentStatus === "paid" && newAccountId) {
          await db
            .update(accounts)
            .set({ balance: sql`${accounts.balance} + ${totalAmount}` })
            .where(eq(accounts.id, newAccountId))
        }
      }
    }

    return NextResponse.json({ ticket })
  } catch {
    return NextResponse.json({ error: "Failed to update ticket" }, { status: 500 })
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    await db.delete(ticketItems).where(eq(ticketItems.ticketId, id))
    await db.delete(tickets).where(eq(tickets.id, id))

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Failed to delete ticket" }, { status: 500 })
  }
}
