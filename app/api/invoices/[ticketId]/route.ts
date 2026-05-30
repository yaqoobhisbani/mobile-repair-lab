import { NextResponse } from "next/server"
import { db } from "@/db"
import { invoices, invoiceItems, tickets, accounts, customers } from "@/db/schema"
import { eq } from "drizzle-orm"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ ticketId: string }> },
) {
  try {
    const { ticketId } = await params

    const [invoice] = await db
      .select({
        id: invoices.id,
        ticketId: invoices.ticketId,
        totalAmount: invoices.totalAmount,
        laborCost: invoices.laborCost,
        discountType: invoices.discountType,
        discountValue: invoices.discountValue,
        paymentStatus: invoices.paymentStatus,
        paymentMethod: invoices.paymentMethod,
        issuedAt: invoices.issuedAt,
      })
      .from(invoices)
      .where(eq(invoices.ticketId, ticketId))
      .limit(1)

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 })
    }

    const items = await db
      .select({
        id: invoiceItems.id,
        partName: invoiceItems.partName,
        sku: invoiceItems.sku,
        unitPrice: invoiceItems.unitPrice,
        quantity: invoiceItems.quantity,
      })
      .from(invoiceItems)
      .where(eq(invoiceItems.invoiceId, invoice.id))

    const [ticket] = await db
      .select({
        id: tickets.id,
        customerName: customers.name,
        customerPhone: customers.phone,
        customerEmail: customers.email,
        brand: tickets.brand,
        model: tickets.model,
        createdAt: tickets.createdAt,
      })
      .from(tickets)
      .leftJoin(customers, eq(tickets.customerId, customers.id))
      .where(eq(tickets.id, ticketId))
      .limit(1)

    return NextResponse.json({ invoice, items, ticket })
  } catch {
    return NextResponse.json({ error: "Failed to fetch invoice" }, { status: 500 })
  }
}
