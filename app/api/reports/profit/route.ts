import { NextResponse } from "next/server"
import { db } from "@/db"
import { tickets, ticketItems, inventory, saleOrders, saleItems, expenses, transactions } from "@/db/schema"
import { eq, desc, and, gte, lte, inArray } from "drizzle-orm"

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

const PERIOD_FORMATS: Record<string, string> = {
  yearly: "YYYY",
  monthly: "YYYY-MM",
  weekly: "IYYY-IW",
  daily: "YYYY-MM-DD",
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
      ? { from: new Date(from), to: new Date(to) }
      : null

    const dateCondition = dateRange
      ? and(gte(transactions.createdAt, dateRange.from), lte(transactions.createdAt, dateRange.to))
      : undefined

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

    // --- Net revenue per item from transactions (the canonical ledger) ---

    const txRows = await db
      .select({
        referenceType: transactions.referenceType,
        referenceId: transactions.referenceId,
        type: transactions.type,
        amount: transactions.amount,
        createdAt: transactions.createdAt,
      })
      .from(transactions)
      .where(
        and(
          inArray(transactions.referenceType, ["ticket", "sale", "expense"]),
          dateCondition!,
        ),
      )

    // Aggregate credits - debits per reference to get net received amount
    const netByRef = new Map<string, {
      referenceType: string
      referenceId: string
      netAmount: number
      date: Date
    }>()
    for (const row of txRows) {
      const key = `${row.referenceType}:${row.referenceId}`
      const amount = parseFloat(row.amount)
      const existing = netByRef.get(key) ?? {
        referenceType: row.referenceType,
        referenceId: row.referenceId ?? "",
        netAmount: 0,
        date: row.createdAt,
      }
      existing.netAmount += row.type === "credit" ? amount : -amount
      if (row.createdAt < existing.date) existing.date = row.createdAt
      netByRef.set(key, existing)
    }

    const ticketTxIds = [...netByRef.values()]
      .filter((t) => t.referenceType === "ticket" && t.netAmount > 0)
      .map((t) => t.referenceId)

    const saleTxIds = [...netByRef.values()]
      .filter((t) => t.referenceType === "sale" && t.netAmount > 0)
      .map((t) => t.referenceId)

    const expenseTxIds = [...netByRef.values()]
      .filter((t) => t.referenceType === "expense")
      .map((t) => Number(t.referenceId))

    // --- Expenses from transactions ---

    const expenseRows = expenseTxIds.length > 0 ? await db
      .select({
        id: expenses.id,
        category: expenses.category,
        description: expenses.description,
      })
      .from(expenses)
      .where(inArray(expenses.id, expenseTxIds)) : []

    const expenseMeta = new Map(expenseRows.map((e) => [e.id, { category: e.category, description: e.description }]))

    const expensesByPeriod = new Map<string, number>()
    const expenseDetails: {
      type: "expense"
      id: string
      date: Date
      description: string
      category: string | null
      amount: number
    }[] = []

    for (const [, tx] of netByRef) {
      if (tx.referenceType !== "expense") continue
      const amount = Math.abs(tx.netAmount)
      if (amount === 0) continue
      const meta = expenseMeta.get(Number(tx.referenceId))
      const key = keyFromDate(tx.date)
      expensesByPeriod.set(key, (expensesByPeriod.get(key) ?? 0) + amount)
      expenseDetails.push({
        type: "expense",
        id: `exp-${tx.referenceId}`,
        date: tx.date,
        description: meta?.description ?? tx.referenceId,
        category: meta?.category ?? null,
        amount,
      })
    }

    expenseDetails.sort((a, b) => b.date.getTime() - a.date.getTime())

    // --- Tickets with transaction revenue ---

    const ticketRows = ticketTxIds.length > 0 ? await db
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
      .where(inArray(tickets.id, ticketTxIds))
      .orderBy(desc(tickets.createdAt)) : []

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
      totalCost: number
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
          totalCost: 0,
        })
      }
      const entry = ticketMap.get(row.id)!
      if (row.itemSellingPrice && row.itemQuantity) {
        const qty = row.itemQuantity
        const selling = parseFloat(row.itemSellingPrice)
        entry.partsRevenue += selling * qty
        if (row.itemCostPrice) {
          const cost = parseFloat(row.itemCostPrice)
          entry.partsProfit += (selling - cost) * qty
          entry.totalCost += cost * qty
        }
      }
    }

    // --- Sales with transaction revenue ---

    const saleRows = saleTxIds.length > 0 ? await db
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
      .where(inArray(saleOrders.id, saleTxIds))
      .orderBy(desc(saleOrders.createdAt)) : []

    const saleMap = new Map<string, {
      customerName: string | null
      discountType: string | null
      discountValue: string | null
      createdAt: Date
      revenue: number
      cost: number
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
          cost: 0,
          profit: 0,
        })
      }
      const entry = saleMap.get(row.id)!
      if (row.itemUnitPrice && row.itemQuantity) {
        const qty = row.itemQuantity
        const unitPrice = parseFloat(row.itemUnitPrice)
        entry.revenue += unitPrice * qty
        if (row.itemCostPrice) {
          const cost = parseFloat(row.itemCostPrice)
          entry.profit += (unitPrice - cost) * qty
          entry.cost += cost * qty
        }
      }
    }

    // --- Build detail entries using transaction amounts for revenue ---

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
      const txRecord = netByRef.get(`ticket:${t.ticketId}`)
      if (!txRecord) continue
      const txTotal = txRecord.netAmount

      const subtotal = t.partsRevenue + t.laborCost
      const { discountAmount, partsDiscount, laborDiscount } = calcDiscount(
        subtotal, t.partsRevenue, t.laborCost, t.discountType, t.discountValue,
      )

      const computedTotal = r(subtotal - discountAmount)
      const ratio = computedTotal > 0 ? txTotal / computedTotal : 1

      const partsRev = r((t.partsRevenue - partsDiscount) * ratio)
      const laborRev = r((t.laborCost - laborDiscount) * ratio)
      const totalRev = r(txTotal)

      const partsCogs = r(t.totalCost)
      const partsProf = r(partsRev - partsCogs)
      const laborProf = r(laborRev)
      const totalProf = r(partsProf + laborProf)

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

    for (const [id, s] of saleMap) {
      const txRecord = netByRef.get(`sale:${id}`)
      if (!txRecord) continue
      const txTotal = txRecord.netAmount

      const { discountAmount } = calcDiscount(
        s.revenue, s.revenue, 0, s.discountType, s.discountValue,
      )

      const computedTotal = r(s.revenue - discountAmount)
      const ratio = computedTotal > 0 ? txTotal / computedTotal : 1

      const revenue = r(s.revenue * ratio)
      const profit = r((s.revenue - s.cost) * ratio)

      details.push({
        type: "sale",
        id,
        date: s.createdAt,
        period: keyFromDate(s.createdAt),
        description: s.customerName || `Sale ${id}`,
        revenue: { parts: revenue, labor: 0, total: r(txTotal) },
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
