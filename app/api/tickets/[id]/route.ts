import { NextResponse } from "next/server"
import { db } from "@/db"
import { tickets, customers, ticketItems, inventory, accounts, ticketStatusHistory, invoices } from "@/db/schema"
import { eq, sql } from "drizzle-orm"
import { insertTransaction } from "@/db/transactions"

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
        paymentAccountType: accounts.type,
        amountPaid: tickets.amountPaid,
        laborCost: tickets.laborCost,
        discountType: tickets.discountType,
        discountValue: tickets.discountValue,

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

    const statusHistory = await db
      .select({
        id: ticketStatusHistory.id,
        status: ticketStatusHistory.status,
        changedAt: ticketStatusHistory.changedAt,
      })
      .from(ticketStatusHistory)
      .where(eq(ticketStatusHistory.ticketId, id))
      .orderBy(ticketStatusHistory.changedAt)

    return NextResponse.json({ ticket, items, statusHistory })
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
    const { status, problemDescription, laborCost, imei, passcode, paymentStatus, paymentAccountId, amountPaid, discountType, discountValue } = body

    const [current] = await db
      .select({
        status: tickets.status,
        paymentStatus: tickets.paymentStatus,
        paymentAccountId: tickets.paymentAccountId,
        amountPaid: tickets.amountPaid,
        laborCost: tickets.laborCost,
        discountType: tickets.discountType,
        discountValue: tickets.discountValue,
      })
      .from(tickets)
      .where(eq(tickets.id, id))
      .limit(1)

    if (!current) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 })
    }

    const resolvedLaborCost = laborCost !== undefined ? laborCost : current.laborCost

    const ticket = await db.transaction(async (tx) => {
      const items = await tx
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
      const resolvedLabor = parseFloat(String(resolvedLaborCost ?? "0"))
      const subtotal = partsTotal + resolvedLabor

      const resolvedDiscountType = discountType !== undefined ? discountType : current.discountType
      const resolvedDiscountValue = discountValue !== undefined ? parseFloat(String(discountValue)) : parseFloat(String(current.discountValue ?? "0"))
      let discountAmount = 0
      if (resolvedDiscountType === "percentage" && resolvedDiscountValue > 0) {
        discountAmount = subtotal * resolvedDiscountValue / 100
      } else if (resolvedDiscountType === "amount" && resolvedDiscountValue > 0) {
        discountAmount = resolvedDiscountValue
      }
      const totalAmount = Math.max(0, subtotal - discountAmount)

      const resolvedAmountPaid =
        paymentStatus === "paid" ? totalAmount
        : paymentStatus === "unpaid" ? 0
        : amountPaid !== undefined ? parseFloat(String(amountPaid))
        : parseFloat(String(current.amountPaid ?? "0"))

      const updateData: Record<string, any> = {}
      if (status !== undefined) updateData.status = status
      if (problemDescription !== undefined) updateData.problemDescription = problemDescription
      if (laborCost !== undefined) updateData.laborCost = laborCost ? String(laborCost) : null
      if (imei !== undefined) updateData.imei = imei
      if (passcode !== undefined) updateData.passcode = passcode
      if (paymentStatus !== undefined) updateData.paymentStatus = paymentStatus
      if (paymentAccountId !== undefined) {
        updateData.paymentAccountId = paymentAccountId ? Number(paymentAccountId) : null
      }
      if (discountType !== undefined) updateData.discountType = discountType || null
      if (discountValue !== undefined) updateData.discountValue = discountValue ? String(discountValue) : null
      updateData.amountPaid = String(resolvedAmountPaid)

      const [t] = await tx
        .update(tickets)
        .set(updateData)
        .where(eq(tickets.id, id))
        .returning()

      if (status !== undefined && status !== current.status) {
        await tx.insert(ticketStatusHistory).values({
          ticketId: id,
          status,
        })
      }

      const newPaymentStatus = paymentStatus ?? current.paymentStatus
      const newAccountId = paymentAccountId !== undefined
        ? (paymentAccountId ? Number(paymentAccountId) : null)
        : current.paymentAccountId
      const oldPaidAmount = parseFloat(String(current.amountPaid ?? "0"))
      const newPaidAmount = resolvedAmountPaid

      const paymentFieldsChanged =
        (paymentStatus !== undefined && newPaymentStatus !== current.paymentStatus) ||
        (paymentAccountId !== undefined && newAccountId !== current.paymentAccountId) ||
        newPaidAmount !== oldPaidAmount

      if (paymentFieldsChanged) {
        if (current.paymentAccountId && oldPaidAmount > 0) {
          await tx
            .update(accounts)
            .set({ balance: sql`${accounts.balance} - ${oldPaidAmount}` })
            .where(eq(accounts.id, current.paymentAccountId))
          await insertTransaction(
            current.paymentAccountId,
            "debit",
            oldPaidAmount,
            `Reversed payment for Ticket ${id}`,
            "ticket",
            id,
            tx
          )
        }

        if (newAccountId && newPaidAmount > 0) {
          await tx
            .update(accounts)
            .set({ balance: sql`${accounts.balance} + ${newPaidAmount}` })
            .where(eq(accounts.id, newAccountId))
          await insertTransaction(
            newAccountId,
            "credit",
            newPaidAmount,
            `Payment received for Ticket ${id}`,
            "ticket",
            id,
            tx
          )
        }
      }

      return t
    })

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

    await db.transaction(async (tx) => {
      const items = await tx
        .select()
        .from(ticketItems)
        .where(eq(ticketItems.ticketId, id))

      for (const item of items) {
        await tx
          .update(inventory)
          .set({ stockQty: sql`${inventory.stockQty} + ${item.quantityUsed}` })
          .where(eq(inventory.id, item.inventoryId))
      }

      const [ticket] = await tx
        .select()
        .from(tickets)
        .where(eq(tickets.id, id))
        .limit(1)

      if (ticket) {
        const paid = parseFloat(String(ticket.amountPaid ?? "0"))
        if (paid > 0 && ticket.paymentAccountId) {
          await tx
            .update(accounts)
            .set({ balance: sql`${accounts.balance} - ${paid}` })
            .where(eq(accounts.id, ticket.paymentAccountId))

          await insertTransaction(
            ticket.paymentAccountId,
            "debit",
            paid,
            `Reversed payment for deleted Ticket ${id}`,
            "ticket",
            id,
            tx,
          )
        }
      }

      await tx.delete(ticketStatusHistory).where(eq(ticketStatusHistory.ticketId, id))
      await tx.delete(invoices).where(eq(invoices.ticketId, id))
      await tx.delete(ticketItems).where(eq(ticketItems.ticketId, id))
      await tx.delete(tickets).where(eq(tickets.id, id))
    })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Failed to delete ticket" }, { status: 500 })
  }
}
