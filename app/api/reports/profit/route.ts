import { NextResponse } from "next/server"
import { db } from "@/db"
import { tickets, ticketItems, inventory } from "@/db/schema"
import { eq, desc, and, gte, lte, or } from "drizzle-orm"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const period = searchParams.get("period") || "monthly"
    const from = searchParams.get("from")
    const to = searchParams.get("to")

    if (!["daily", "weekly", "monthly", "yearly"].includes(period)) {
      return NextResponse.json({ error: "Invalid period" }, { status: 400 })
    }

    const conditions = [or(eq(tickets.status, "completed"), eq(tickets.status, "ready_for_pickup"))]
    if (from) conditions.push(gte(tickets.createdAt, new Date(from)))
    if (to) {
      const toDate = new Date(to)
      toDate.setHours(23, 59, 59, 999)
      conditions.push(lte(tickets.createdAt, toDate))
    }

    const completedTickets = await db
      .select({
        id: tickets.id,
        laborCost: tickets.laborCost,
        createdAt: tickets.createdAt,
        itemSellingPrice: inventory.sellingPrice,
        itemCostPrice: inventory.costPrice,
        itemQuantity: ticketItems.quantityUsed,
      })
      .from(tickets)
      .leftJoin(ticketItems, eq(ticketItems.ticketId, tickets.id))
      .leftJoin(inventory, eq(ticketItems.inventoryId, inventory.id))
      .where(and(...conditions))
      .orderBy(desc(tickets.createdAt))

    const grouped: Record<string, { partsProfit: number; laborProfit: number; tickets: Set<string> }> = {}

    for (const row of completedTickets) {
      const d = new Date(row.createdAt)
      let key: string

      if (period === "yearly") {
        key = `${d.getFullYear()}`
      } else if (period === "monthly") {
        key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
      } else if (period === "weekly") {
        const start = new Date(d)
        start.setDate(start.getDate() - start.getDay())
        key = start.toISOString().split("T")[0]
      } else {
        key = d.toISOString().split("T")[0]
      }

      if (!grouped[key]) {
        grouped[key] = { partsProfit: 0, laborProfit: 0, tickets: new Set() }
      }

      const group = grouped[key]
      group.tickets.add(row.id)

      const labor = parseFloat(row.laborCost ?? "0")
      if (labor > 0) {
        group.laborProfit = labor
      }

      if (row.itemSellingPrice && row.itemCostPrice && row.itemQuantity) {
        const profit =
          (parseFloat(row.itemSellingPrice) - parseFloat(row.itemCostPrice)) * row.itemQuantity
        group.partsProfit += profit
      }
    }

    const data = Object.entries(grouped)
      .map(([periodKey, g]) => ({
        period: periodKey,
        partsProfit: Math.round(g.partsProfit * 100) / 100,
        laborProfit: Math.round(g.laborProfit * 100) / 100,
        totalProfit: Math.round((g.partsProfit + g.laborProfit) * 100) / 100,
        ticketCount: g.tickets.size,
      }))
      .sort((a, b) => b.period.localeCompare(a.period))

    const summary = data.reduce(
      (acc, r) => ({
        totalPartsProfit: acc.totalPartsProfit + r.partsProfit,
        totalLaborProfit: acc.totalLaborProfit + r.laborProfit,
        totalProfit: acc.totalProfit + r.totalProfit,
        totalTickets: acc.totalTickets + r.ticketCount,
      }),
      { totalPartsProfit: 0, totalLaborProfit: 0, totalProfit: 0, totalTickets: 0 }
    )

    return NextResponse.json({ data, summary })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: "Failed to fetch report" }, { status: 500 })
  }
}
