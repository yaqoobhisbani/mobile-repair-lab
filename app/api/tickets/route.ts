import { NextResponse } from "next/server"
import { db } from "@/db"
import { tickets, customers, ticketStatusHistory } from "@/db/schema"
import { eq, desc, ilike, or } from "drizzle-orm"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search")
    const limit = searchParams.get("limit")

    let items
    if (search) {
      const q = db
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
        .where(
          or(
            ilike(tickets.id, `%${search}%`),
            ilike(tickets.brand, `%${search}%`),
            ilike(tickets.model, `%${search}%`),
            ilike(customers.name, `%${search}%`),
          ),
        )
        .orderBy(desc(tickets.createdAt))
      items = await (limit ? q.limit(Number(limit)) : q)
    } else {
      const q = db
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
      items = await (limit ? q.limit(Number(limit)) : q)
    }

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

    const [cust] = await db
      .select({ id: customers.id })
      .from(customers)
      .where(eq(customers.id, customerId))
      .limit(1)

    if (!cust) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 })
    }

    const ticket = await db.transaction(async (tx) => {
      const [lastTicket] = await tx
        .select({ id: tickets.id })
        .from(tickets)
        .orderBy(desc(tickets.id))
        .limit(1)

      let nextId = "TKT-001"
      if (lastTicket) {
        const num = parseInt(lastTicket.id.replace("TKT-", ""), 10)
        nextId = `TKT-${String(num + 1).padStart(3, "0")}`
      }

      const [t] = await tx
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

      await tx.insert(ticketStatusHistory).values({
        ticketId: nextId,
        status: "received",
      })

      return t
    })

    return NextResponse.json({ ticket }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to create ticket" }, { status: 500 })
  }
}
