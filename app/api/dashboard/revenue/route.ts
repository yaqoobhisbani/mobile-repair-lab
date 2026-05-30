import { NextResponse } from "next/server"
import { db } from "@/db"
import { tickets, ticketItems, inventory, saleOrders } from "@/db/schema"
import { eq, and, or } from "drizzle-orm"

function calculateNetTotal(
  partsTotal: number,
  laborCost: number,
  discountType: string | null,
  discountValue: string | null,
) {
  const subtotal = partsTotal + laborCost
  if (!discountType || !discountValue) return subtotal
  const val = parseFloat(discountValue)
  if (val <= 0) return subtotal
  const discountAmount = discountType === "percentage"
    ? subtotal * val / 100
    : val
  return Math.max(0, subtotal - discountAmount)
}

export async function GET() {
  try {
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const yearStart = new Date(now.getFullYear(), 0, 1)

    // --- Tickets ---

    const ticketRows = await db
      .select({
        id: tickets.id,
        laborCost: tickets.laborCost,
        discountType: tickets.discountType,
        discountValue: tickets.discountValue,
        createdAt: tickets.createdAt,
        sellingPrice: inventory.sellingPrice,
        quantityUsed: ticketItems.quantityUsed,
      })
      .from(tickets)
      .leftJoin(ticketItems, eq(ticketItems.ticketId, tickets.id))
      .leftJoin(inventory, eq(ticketItems.inventoryId, inventory.id))
      .where(
        and(
          or(eq(tickets.status, "completed"), eq(tickets.status, "ready_for_pickup")),
        ),
      )

    const ticketTotals = new Map<string, {
      createdAt: Date
      partsTotal: number
      laborCost: number
      discountType: string | null
      discountValue: string | null
    }>()

    for (const row of ticketRows) {
      if (!ticketTotals.has(row.id)) {
        ticketTotals.set(row.id, {
          createdAt: row.createdAt,
          partsTotal: 0,
          laborCost: parseFloat(row.laborCost ?? "0"),
          discountType: row.discountType,
          discountValue: row.discountValue,
        })
      }
      const entry = ticketTotals.get(row.id)!
      if (row.sellingPrice && row.quantityUsed) {
        entry.partsTotal += parseFloat(row.sellingPrice) * row.quantityUsed
      }
    }

    let ticketToday = 0
    let ticketMonth = 0
    let ticketYear = 0
    let ticketAll = 0

    for (const [, t] of ticketTotals) {
      const net = calculateNetTotal(t.partsTotal, t.laborCost, t.discountType, t.discountValue)
      ticketAll += net
      if (t.createdAt >= yearStart) ticketYear += net
      if (t.createdAt >= monthStart) ticketMonth += net
      if (t.createdAt >= todayStart) ticketToday += net
    }

    // --- Sales ---

    const saleRows = await db
      .select({
        totalAmount: saleOrders.totalAmount,
        createdAt: saleOrders.createdAt,
      })
      .from(saleOrders)

    let saleToday = 0
    let saleMonth = 0
    let saleYear = 0
    let saleAll = 0

    for (const row of saleRows) {
      const amount = parseFloat(row.totalAmount)
      saleAll += amount
      if (row.createdAt >= yearStart) saleYear += amount
      if (row.createdAt >= monthStart) saleMonth += amount
      if (row.createdAt >= todayStart) saleToday += amount
    }

    const round2 = (v: number) => Math.round(v * 100) / 100

    return NextResponse.json({
      today: {
        tickets: round2(ticketToday),
        sales: round2(saleToday),
        total: round2(ticketToday + saleToday),
      },
      month: {
        tickets: round2(ticketMonth),
        sales: round2(saleMonth),
        total: round2(ticketMonth + saleMonth),
      },
      year: {
        tickets: round2(ticketYear),
        sales: round2(saleYear),
        total: round2(ticketYear + saleYear),
      },
      all: {
        tickets: round2(ticketAll),
        sales: round2(saleAll),
        total: round2(ticketAll + saleAll),
      },
    })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: "Failed to fetch dashboard revenue" }, { status: 500 })
  }
}
