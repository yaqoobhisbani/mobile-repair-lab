import { NextResponse } from "next/server"
import { db } from "@/db"
import { tickets, ticketItems, inventory, saleOrders, saleItems } from "@/db/schema"
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

    const dateRange = from && to
      ? [gte(tickets.createdAt, new Date(from)), lte(tickets.createdAt, new Date(to))]
      : []

    const keyFromDate = (d: Date) => {
      if (period === "yearly") return `${d.getFullYear()}`
      if (period === "monthly") return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
      if (period === "weekly") {
        const start = new Date(d)
        start.setDate(start.getDate() - d.getDay())
        return start.toISOString().split("T")[0]
      }
      return d.toISOString().split("T")[0]
    }

    const details: {
      type: "ticket" | "sale"
      id: string
      date: Date
      period: string
      description: string
      partsProfit: number
      laborProfit: number
      totalProfit: number
    }[] = []

    const ticketConditions = [
      or(eq(tickets.status, "completed"), eq(tickets.status, "ready_for_pickup")),
      ...dateRange,
    ]

    const ticketRows = await db
      .select({
        id: tickets.id,
        brand: tickets.brand,
        model: tickets.model,
        laborCost: tickets.laborCost,
        createdAt: tickets.createdAt,
        itemSellingPrice: inventory.sellingPrice,
        itemCostPrice: inventory.costPrice,
        itemQuantity: ticketItems.quantityUsed,
      })
      .from(tickets)
      .leftJoin(ticketItems, eq(ticketItems.ticketId, tickets.id))
      .leftJoin(inventory, eq(ticketItems.inventoryId, inventory.id))
      .where(and(...ticketConditions))
      .orderBy(desc(tickets.createdAt))

    const ticketMap = new Map<string, { brand: string; model: string; laborCost: number; createdAt: Date; partsProfit: number }>()

    for (const row of ticketRows) {
      if (!ticketMap.has(row.id)) {
        ticketMap.set(row.id, {
          brand: row.brand,
          model: row.model,
          laborCost: parseFloat(row.laborCost ?? "0"),
          createdAt: row.createdAt,
          partsProfit: 0,
        })
      }
      const entry = ticketMap.get(row.id)!
      if (row.itemSellingPrice && row.itemCostPrice && row.itemQuantity) {
        entry.partsProfit += (parseFloat(row.itemSellingPrice) - parseFloat(row.itemCostPrice)) * row.itemQuantity
      }
    }

    for (const [, t] of ticketMap) {
      const laborProfit = t.laborCost
      const partsProfit = Math.round(t.partsProfit * 100) / 100
      details.push({
        type: "ticket",
        id: "",
        date: t.createdAt,
        period: keyFromDate(t.createdAt),
        description: `${t.brand} ${t.model}`,
        partsProfit,
        laborProfit,
        totalProfit: Math.round((partsProfit + laborProfit) * 100) / 100,
      })
    }

    const saleDateRange = from && to
      ? [gte(saleOrders.createdAt, new Date(from)), lte(saleOrders.createdAt, new Date(to))]
      : []

    const saleRows = await db
      .select({
        id: saleOrders.id,
        customerName: saleOrders.customerName,
        createdAt: saleOrders.createdAt,
        itemUnitPrice: saleItems.unitPrice,
        itemQuantity: saleItems.quantity,
        itemCostPrice: inventory.costPrice,
      })
      .from(saleOrders)
      .leftJoin(saleItems, eq(saleItems.saleId, saleOrders.id))
      .leftJoin(inventory, eq(saleItems.inventoryId, inventory.id))
      .where(and(...saleDateRange))
      .orderBy(desc(saleOrders.createdAt))

    const saleMap = new Map<string, { customerName: string | null; createdAt: Date; profit: number }>()

    for (const row of saleRows) {
      if (!saleMap.has(row.id)) {
        saleMap.set(row.id, {
          customerName: row.customerName,
          createdAt: row.createdAt,
          profit: 0,
        })
      }
      const entry = saleMap.get(row.id)!
      if (row.itemUnitPrice && row.itemCostPrice && row.itemQuantity) {
        entry.profit += (parseFloat(row.itemUnitPrice) - parseFloat(row.itemCostPrice)) * row.itemQuantity
      }
    }

    for (const [id, s] of saleMap) {
      const profit = Math.round(s.profit * 100) / 100
      details.push({
        type: "sale",
        id,
        date: s.createdAt,
        period: keyFromDate(s.createdAt),
        description: s.customerName || `Sale ${id}`,
        partsProfit: profit,
        laborProfit: 0,
        totalProfit: profit,
      })
    }

    details.sort((a, b) => b.date.getTime() - a.date.getTime())

    const grouped: Record<string, {
      partsProfit: number
      laborProfit: number
      salesProfit: number
      totalProfit: number
      ticketCount: number
      saleCount: number
    }> = {}

    for (const d of details) {
      if (!grouped[d.period]) {
        grouped[d.period] = { partsProfit: 0, laborProfit: 0, salesProfit: 0, totalProfit: 0, ticketCount: 0, saleCount: 0 }
      }
      const g = grouped[d.period]
      if (d.type === "ticket") {
        g.partsProfit += d.partsProfit
        g.laborProfit += d.laborProfit
        g.ticketCount++
      } else {
        g.salesProfit += d.totalProfit
        g.saleCount++
      }
      g.totalProfit += d.totalProfit
    }

    for (const g of Object.values(grouped)) {
      g.partsProfit = Math.round(g.partsProfit * 100) / 100
      g.laborProfit = Math.round(g.laborProfit * 100) / 100
      g.salesProfit = Math.round(g.salesProfit * 100) / 100
      g.totalProfit = Math.round(g.totalProfit * 100) / 100
    }

    const data = Object.entries(grouped)
      .map(([periodKey, g]) => ({
        period: periodKey,
        partsProfit: g.partsProfit,
        laborProfit: g.laborProfit,
        salesProfit: g.salesProfit,
        totalProfit: g.totalProfit,
        ticketCount: g.ticketCount,
        saleCount: g.saleCount,
      }))
      .sort((a, b) => b.period.localeCompare(a.period))

    const summary = data.reduce(
      (acc, r) => ({
        totalPartsProfit: acc.totalPartsProfit + r.partsProfit,
        totalLaborProfit: acc.totalLaborProfit + r.laborProfit,
        totalSalesProfit: acc.totalSalesProfit + r.salesProfit,
        totalProfit: acc.totalProfit + r.totalProfit,
        totalTickets: acc.totalTickets + r.ticketCount,
        totalSales: acc.totalSales + r.saleCount,
      }),
      { totalPartsProfit: 0, totalLaborProfit: 0, totalSalesProfit: 0, totalProfit: 0, totalTickets: 0, totalSales: 0 }
    )

    return NextResponse.json({ data, summary, details })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: "Failed to fetch report" }, { status: 500 })
  }
}
