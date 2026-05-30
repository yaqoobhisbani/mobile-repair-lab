import { NextResponse } from "next/server"
import { db } from "@/db"
import { tickets, ticketStatusHistory } from "@/db/schema"
import { eq, desc } from "drizzle-orm"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params

    const [ticket] = await db
      .select({
        id: tickets.id,
        brand: tickets.brand,
        model: tickets.model,
        problemCategory: tickets.problemCategory,
        status: tickets.status,
        createdAt: tickets.createdAt,
      })
      .from(tickets)
      .where(eq(tickets.id, id))
      .limit(1)

    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 })
    }

    const statusHistory = await db
      .select({
        status: ticketStatusHistory.status,
        changedAt: ticketStatusHistory.changedAt,
      })
      .from(ticketStatusHistory)
      .where(eq(ticketStatusHistory.ticketId, id))
      .orderBy(ticketStatusHistory.changedAt)

    return NextResponse.json({ ticket, statusHistory })
  } catch {
    return NextResponse.json({ error: "Failed to fetch ticket" }, { status: 500 })
  }
}
