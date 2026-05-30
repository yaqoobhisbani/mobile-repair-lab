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

    const saleDateRange = from && to
      ? [gte(saleOrders.createdAt, new Date(from)), lte(saleOrders.createdAt, new Date(to))]
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

    // --- Tickets ---

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

    const ticketMap = new Map<string, {
      ticketId: string
      brand: string
      model: string
      laborCost: number
      createdAt: Date
      partsRevenue: number
      partsProfit: number
    }>()

    for (const row of ticketRows) {
      if (!ticketMap.has(row.id)) {
        ticketMap.set(row.id, {
          ticketId: row.id,
          brand: row.brand,
          model: row.model,
          laborCost: parseFloat(row.laborCost ?? "0"),
          createdAt: row.createdAt,
          partsRevenue: 0,
          partsProfit: 0,
        })
      }
      const entry = ticketMap.get(row.id)!
      if (row.itemSellingPrice && row.itemQuantity) {
        const qty = row.itemQuantity
        const selling = parseFloat(row.itemSellingPrice)
        entry.partsRevenue += selling * qty
        if (row.itemCostPrice) {
          entry.partsProfit += (selling - parseFloat(row.itemCostPrice)) * qty
        }
      }
    }

    const details: {
      type: "ticket" | "sale"
      id: string
      date: Date
      period: string
      description: string
      revenue: { parts: number; labor: number; total: number }
      profit: { parts: number; labor: number; total: number }
    }[] = []

    for (const [, t] of ticketMap) {
      const partsRevenue = Math.round(t.partsRevenue * 100) / 100
      const partsProfit = Math.round(t.partsProfit * 100) / 100
      const laborRevenue = t.laborCost
      const laborProfit = t.laborCost
      details.push({
        type: "ticket",
        id: t.ticketId,
        date: t.createdAt,
        period: keyFromDate(t.createdAt),
        description: `${t.brand} ${t.model}`,
        revenue: {
          parts: partsRevenue,
          labor: laborRevenue,
          total: Math.round((partsRevenue + laborRevenue) * 100) / 100,
        },
        profit: {
          parts: partsProfit,
          labor: laborProfit,
          total: Math.round((partsProfit + laborProfit) * 100) / 100,
        },
      })
    }

    // --- Sales ---

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

    const saleMap = new Map<string, {
      customerName: string | null
      createdAt: Date
      revenue: number
      profit: number
    }>()

    for (const row of saleRows) {
      if (!saleMap.has(row.id)) {
        saleMap.set(row.id, {
          customerName: row.customerName,
          createdAt: row.createdAt,
          revenue: 0,
          profit: 0,
        })
      }
      const entry = saleMap.get(row.id)!
      if (row.itemUnitPrice && row.itemQuantity) {
        const qty = row.itemQuantity
        const unitPrice = parseFloat(row.itemUnitPrice)
        entry.revenue += unitPrice * qty
        if (row.itemCostPrice) {
          entry.profit += (unitPrice - parseFloat(row.itemCostPrice)) * qty
        }
      }
    }

    for (const [id, s] of saleMap) {
      const revenue = Math.round(s.revenue * 100) / 100
      const profit = Math.round(s.profit * 100) / 100
      details.push({
        type: "sale",
        id,
        date: s.createdAt,
        period: keyFromDate(s.createdAt),
        description: s.customerName || `Sale ${id}`,
        revenue: { parts: revenue, labor: 0, total: revenue },
        profit: { parts: profit, labor: 0, total: profit },
      })
    }

    details.sort((a, b) => b.date.getTime() - a.date.getTime())

    // --- Grouped data ---

    const grouped: Record<string, {
      partsRevenue: number
      partsProfit: number
      laborRevenue: number
      laborProfit: number
      salesRevenue: number
      salesProfit: number
      totalRevenue: number
      totalProfit: number
      ticketCount: number
      saleCount: number
    }> = {}

    for (const d of details) {
      if (!grouped[d.period]) {
        grouped[d.period] = {
          partsRevenue: 0, partsProfit: 0,
          laborRevenue: 0, laborProfit: 0,
          salesRevenue: 0, salesProfit: 0,
          totalRevenue: 0, totalProfit: 0,
          ticketCount: 0, saleCount: 0,
        }
      }
      const g = grouped[d.period]
      if (d.type === "ticket") {
        g.partsRevenue += d.revenue.parts
        g.partsProfit += d.profit.parts
        g.laborRevenue += d.revenue.labor
        g.laborProfit += d.profit.labor
        g.ticketCount++
      } else {
        g.salesRevenue += d.revenue.total
        g.salesProfit += d.profit.total
        g.saleCount++
      }
      g.totalRevenue += d.revenue.total
      g.totalProfit += d.profit.total
    }

    for (const g of Object.values(grouped)) {
      g.partsRevenue = Math.round(g.partsRevenue * 100) / 100
      g.partsProfit = Math.round(g.partsProfit * 100) / 100
      g.laborRevenue = Math.round(g.laborRevenue * 100) / 100
      g.laborProfit = Math.round(g.laborProfit * 100) / 100
      g.salesRevenue = Math.round(g.salesRevenue * 100) / 100
      g.salesProfit = Math.round(g.salesProfit * 100) / 100
      g.totalRevenue = Math.round(g.totalRevenue * 100) / 100
      g.totalProfit = Math.round(g.totalProfit * 100) / 100
    }

    const data = Object.entries(grouped)
      .map(([periodKey, g]) => ({
        period: periodKey,
        partsRevenue: g.partsRevenue,
        partsProfit: g.partsProfit,
        laborRevenue: g.laborRevenue,
        laborProfit: g.laborProfit,
        salesRevenue: g.salesRevenue,
        salesProfit: g.salesProfit,
        totalRevenue: g.totalRevenue,
        totalProfit: g.totalProfit,
        ticketCount: g.ticketCount,
        saleCount: g.saleCount,
      }))
      .sort((a, b) => b.period.localeCompare(a.period))

    const summary = data.reduce(
      (acc, r) => ({
        totalPartsRevenue: acc.totalPartsRevenue + r.partsRevenue,
        totalPartsProfit: acc.totalPartsProfit + r.partsProfit,
        totalLaborRevenue: acc.totalLaborRevenue + r.laborRevenue,
        totalLaborProfit: acc.totalLaborProfit + r.laborProfit,
        totalSalesRevenue: acc.totalSalesRevenue + r.salesRevenue,
        totalSalesProfit: acc.totalSalesProfit + r.salesProfit,
        totalRevenue: acc.totalRevenue + r.totalRevenue,
        totalProfit: acc.totalProfit + r.totalProfit,
        totalTickets: acc.totalTickets + r.ticketCount,
        totalSales: acc.totalSales + r.saleCount,
      }),
      {
        totalPartsRevenue: 0, totalPartsProfit: 0,
        totalLaborRevenue: 0, totalLaborProfit: 0,
        totalSalesRevenue: 0, totalSalesProfit: 0,
        totalRevenue: 0, totalProfit: 0,
        totalTickets: 0, totalSales: 0,
      }
    )

    return NextResponse.json({ data, summary, details })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: "Failed to fetch report" }, { status: 500 })
  }
}
