import { NextResponse } from "next/server"
import { db } from "@/db"
import { tickets, customers, ticketStatusHistory } from "@/db/schema"
import { eq, desc } from "drizzle-orm"

export async function GET() {
  try {
    const items = await db
      .select({
        id: tickets.id,
        customerId: tickets.customerId,
        customerName: customers.name,
        customerPhone: customers.phone,
        brand: tickets.brand,
        model: tickets.model,
        status: tickets.status,
        paymentStatus: tickets.paymentStatus,
        createdAt: tickets.createdAt,
      })
      .from(tickets)
      .leftJoin(customers, eq(tickets.customerId, customers.id))
      .orderBy(desc(tickets.createdAt))

    return NextResponse.json({ tickets: items })
  } catch {
    return NextResponse.json({ error: "Failed to fetch tickets" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { customerId, brand, model, imei, passcode, problemCategory, problemDescription, laborCost } = body

    if (!customerId || !brand || !model || !problemCategory) {
      return NextResponse.json({ error: "Customer, brand, model, and problem category are required" }, { status: 400 })
    }

    const [lastTicket] = await db
      .select({ id: tickets.id })
      .from(tickets)
      .orderBy(desc(tickets.id))
      .limit(1)

    let nextId = "TKT-001"
    if (lastTicket) {
      const num = parseInt(lastTicket.id.replace("TKT-", ""), 10)
      nextId = `TKT-${String(num + 1).padStart(3, "0")}`
    }

    const [ticket] = await db
      .insert(tickets)
      .values({
        id: nextId,
        customerId,
        brand,
        model,
        imei: imei || null,
        passcode: passcode || null,
        problemCategory,
        problemDescription: problemDescription || null,
        laborCost: laborCost ? String(laborCost) : null,

      })
      .returning()

    await db.insert(ticketStatusHistory).values({
      ticketId: nextId,
      status: "received",
    })

    return NextResponse.json({ ticket }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to create ticket" }, { status: 500 })
  }
}
