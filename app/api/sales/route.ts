import { NextResponse } from "next/server"
import { db } from "@/db"
import { saleOrders, saleItems, inventory, accounts, customers } from "@/db/schema"
import { eq, desc, ilike, or, sql } from "drizzle-orm"
import { insertTransaction } from "@/db/transactions"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search")
    const limit = searchParams.get("limit")

    let items
    const q = db
      .select({
        id: saleOrders.id,
        customerId: saleOrders.customerId,
        customerName: saleOrders.customerName,
        customerPhone: saleOrders.customerPhone,
        paymentAccountId: saleOrders.paymentAccountId,
        paymentAccountName: accounts.name,
        totalAmount: saleOrders.totalAmount,
        createdAt: saleOrders.createdAt,
      })
      .from(saleOrders)
      .leftJoin(accounts, eq(saleOrders.paymentAccountId, accounts.id))
      .orderBy(desc(saleOrders.createdAt))

    if (search) {
      items = await q.where(
        or(
          ilike(saleOrders.id, `%${search}%`),
          ilike(saleOrders.customerName, `%${search}%`),
          ilike(saleOrders.customerPhone, `%${search}%`),
        ),
      )
    } else if (limit) {
      items = await q.limit(Number(limit))
    } else {
      items = await q
    }

    return NextResponse.json({ sales: items })
  } catch {
    return NextResponse.json({ error: "Failed to fetch sales" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { items: saleItemInputs, paymentAccountId, customerId, customerName, customerPhone, discountType, discountValue } = body

    if (!saleItemInputs || !saleItemInputs.length || !paymentAccountId) {
      return NextResponse.json({ error: "Items and payment account are required" }, { status: 400 })
    }

    const [account] = await db
      .select()
      .from(accounts)
      .where(eq(accounts.id, paymentAccountId))
      .limit(1)

    if (!account) {
      return NextResponse.json({ error: "Payment account not found" }, { status: 404 })
    }

    let resolvedName = customerName || null
    let resolvedPhone = customerPhone || null
    if (customerId) {
      const [cust] = await db
        .select()
        .from(customers)
        .where(eq(customers.id, customerId))
        .limit(1)
      if (!cust) {
        return NextResponse.json({ error: "Customer not found" }, { status: 404 })
      }
      resolvedName = cust.name
      resolvedPhone = cust.phone
    }

    const sale = await db.transaction(async (tx) => {
      const [lastSale] = await tx
        .select({ id: saleOrders.id })
        .from(saleOrders)
        .orderBy(desc(saleOrders.id))
        .limit(1)

      let nextId = "SALE-001"
      if (lastSale) {
        const num = parseInt(lastSale.id.replace("SALE-", ""), 10)
        nextId = `SALE-${String(num + 1).padStart(3, "0")}`
      }

      let totalAmount = 0
      const saleItemValues = []

      for (const input of saleItemInputs) {
        const [part] = await tx
          .select()
          .from(inventory)
          .where(eq(inventory.id, input.inventoryId))
          .limit(1)

        if (!part) {
          throw new Error(`Part with ID ${input.inventoryId} not found`)
        }

        if (part.stockQty < input.quantity) {
          throw new Error(`Insufficient stock for ${part.partName}. Only ${part.stockQty} available.`)
        }

        const unitPrice = parseFloat(part.sellingPrice ?? "0")
        const lineTotal = unitPrice * input.quantity
        totalAmount += lineTotal

        await tx
          .update(inventory)
          .set({ stockQty: sql`${inventory.stockQty} - ${input.quantity}` })
          .where(eq(inventory.id, input.inventoryId))

        saleItemValues.push({
          saleId: nextId,
          inventoryId: input.inventoryId,
          quantity: input.quantity,
          unitPrice: String(unitPrice),
        })
      }

      let netAmount = totalAmount
      if (discountType === "percentage" && discountValue) {
        netAmount = totalAmount - (totalAmount * parseFloat(discountValue) / 100)
      } else if (discountType === "amount" && discountValue) {
        netAmount = totalAmount - parseFloat(discountValue)
      }
      netAmount = Math.max(0, netAmount)

      const [s] = await tx
        .insert(saleOrders)
        .values({
          id: nextId,
          customerId: customerId || null,
          customerName: resolvedName,
          customerPhone: resolvedPhone,
          paymentAccountId,
          totalAmount: String(netAmount),
          discountType: discountType || null,
          discountValue: discountValue ? String(discountValue) : null,
        })
        .returning()

      if (saleItemValues.length > 0) {
        await tx.insert(saleItems).values(saleItemValues)
      }

      await tx
        .update(accounts)
        .set({ balance: sql`${accounts.balance} + ${netAmount}` })
        .where(eq(accounts.id, paymentAccountId))

      await insertTransaction(
        paymentAccountId,
        "credit",
        netAmount,
        `Sale ${nextId}`,
        "sale",
        nextId,
        tx,
      )

      return s
    })

    return NextResponse.json({ sale }, { status: 201 })
  } catch (error: any) {
    const message = error?.message || "Failed to create sale"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
