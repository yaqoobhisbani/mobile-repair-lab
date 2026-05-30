import { NextResponse } from "next/server"
import { db } from "@/db"
import { tickets, ticketItems, inventory, saleOrders, saleItems, expenses } from "@/db/schema"
import { eq, desc, and, gte, lte, or } from "drizzle-orm"

function calcDiscount(
  subtotal: number,
  parts: number,
  labor: number,
  discountType: string | null,
  discountValue: string | null,
) {
  if (!discountType || !discountValue) return { discountAmount: 0, partsDiscount: 0, laborDiscount: 0 }
  const val = parseFloat(discountValue)
  if (val <= 0) return { discountAmount: 0, partsDiscount: 0, laborDiscount: 0 }

  const discountAmount = discountType === "percentage"
    ? subtotal * val / 100
    : val

  let partsDiscount = 0
  let laborDiscount = 0
  if (discountAmount > 0 && subtotal > 0) {
    partsDiscount = discountAmount * (parts / subtotal)
    laborDiscount = discountAmount * (labor / subtotal)
  }
  return { discountAmount, partsDiscount, laborDiscount }
}

function r(v: number) {
  return Math.round(v * 100) / 100
}

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

    const expenseDateRange = from && to
      ? [gte(expenses.date, new Date(from)), lte(expenses.date, new Date(to))]
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
        discountType: tickets.discountType,
        discountValue: tickets.discountValue,
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
      discountType: string | null
      discountValue: string | null
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
          discountType: row.discountType,
          discountValue: row.discountValue,
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
      const subtotal = t.partsRevenue + t.laborCost
      const { discountAmount, partsDiscount, laborDiscount } = calcDiscount(
        subtotal, t.partsRevenue, t.laborCost, t.discountType, t.discountValue,
      )

      const partsRev = r(t.partsRevenue - partsDiscount)
      const laborRev = r(t.laborCost - laborDiscount)
      const totalRev = r(subtotal - discountAmount)

      const partsProf = r(t.partsProfit - partsDiscount)
      const laborProf = r(t.laborCost - laborDiscount)
      const totalProf = r((t.partsProfit + t.laborCost) - discountAmount)

      details.push({
        type: "ticket",
        id: t.ticketId,
        date: t.createdAt,
        period: keyFromDate(t.createdAt),
        description: `${t.brand} ${t.model}`,
        revenue: { parts: partsRev, labor: laborRev, total: totalRev },
        profit: { parts: partsProf, labor: laborProf, total: totalProf },
      })
    }

    // --- Sales ---

    const saleRows = await db
      .select({
        id: saleOrders.id,
        customerName: saleOrders.customerName,
        discountType: saleOrders.discountType,
        discountValue: saleOrders.discountValue,
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
      discountType: string | null
      discountValue: string | null
      createdAt: Date
      revenue: number
      profit: number
    }>()

    for (const row of saleRows) {
      if (!saleMap.has(row.id)) {
        saleMap.set(row.id, {
          customerName: row.customerName,
          discountType: row.discountType,
          discountValue: row.discountValue,
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
      const { discountAmount } = calcDiscount(
        s.revenue, s.revenue, 0, s.discountType, s.discountValue,
      )

      const revenue = r(s.revenue - discountAmount)
      const profit = r(s.profit - discountAmount)

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

    // --- Expenses ---

    const expenseConditions = from && to
      ? [gte(expenses.date, new Date(from)), lte(expenses.date, new Date(to))]
      : []

    const expenseRows = await db
      .select({
        id: expenses.id,
        amount: expenses.amount,
        description: expenses.description,
        category: expenses.category,
        createdAt: expenses.date,
      })
      .from(expenses)
      .where(and(...expenseConditions))
      .orderBy(desc(expenses.date))

    const expensesByPeriod = new Map<string, number>()
    const expenseDetails: {
      type: "expense"
      id: string
      date: Date
      description: string
      category: string | null
      amount: number
    }[] = []

    for (const row of expenseRows) {
      const key = keyFromDate(row.createdAt)
      const amount = parseFloat(row.amount)
      expensesByPeriod.set(key, (expensesByPeriod.get(key) ?? 0) + amount)
      expenseDetails.push({
        type: "expense",
        id: `exp-${row.id}`,
        date: row.createdAt,
        description: row.description,
        category: row.category,
        amount,
      })
    }

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
      expenses: number
      netProfit: number
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
          expenses: 0, netProfit: 0,
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

    for (const [periodKey, g] of Object.entries(grouped)) {
      g.expenses = r(expensesByPeriod.get(periodKey) ?? 0)
      g.netProfit = r(g.totalProfit - g.expenses)
    }

    for (const g of Object.values(grouped)) {
      g.partsRevenue = r(g.partsRevenue)
      g.partsProfit = r(g.partsProfit)
      g.laborRevenue = r(g.laborRevenue)
      g.laborProfit = r(g.laborProfit)
      g.salesRevenue = r(g.salesRevenue)
      g.salesProfit = r(g.salesProfit)
      g.totalRevenue = r(g.totalRevenue)
      g.totalProfit = r(g.totalProfit)
      g.expenses = r(g.expenses)
      g.netProfit = r(g.netProfit)
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
        expenses: g.expenses,
        netProfit: g.netProfit,
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
        totalExpenses: acc.totalExpenses + r.expenses,
        totalNetProfit: acc.totalNetProfit + r.netProfit,
        totalTickets: acc.totalTickets + r.ticketCount,
        totalSales: acc.totalSales + r.saleCount,
      }),
      {
        totalPartsRevenue: 0, totalPartsProfit: 0,
        totalLaborRevenue: 0, totalLaborProfit: 0,
        totalSalesRevenue: 0, totalSalesProfit: 0,
        totalRevenue: 0, totalProfit: 0,
        totalExpenses: 0, totalNetProfit: 0,
        totalTickets: 0, totalSales: 0,
      }
    )

    return NextResponse.json({ data, summary, details, expenseDetails })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: "Failed to fetch report" }, { status: 500 })
  }
}
