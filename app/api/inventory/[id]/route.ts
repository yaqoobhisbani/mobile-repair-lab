import { NextResponse } from "next/server"
import { db } from "@/db"
import { inventory, accounts } from "@/db/schema"
import { eq, sql } from "drizzle-orm"
import { insertTransaction } from "@/db/transactions"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const numericId = Number(id)

    if (isNaN(numericId)) {
      const [item] = await db
        .select()
        .from(inventory)
        .where(eq(inventory.sku, id))
        .limit(1)

      if (!item) {
        return NextResponse.json({ error: "Part not found" }, { status: 404 })
      }
      return NextResponse.json({ item })
    }

    const [item] = await db
      .select()
      .from(inventory)
      .where(eq(inventory.id, numericId))
      .limit(1)

    if (!item) {
      return NextResponse.json({ error: "Part not found" }, { status: 404 })
    }

    return NextResponse.json({ item })
  } catch {
    return NextResponse.json({ error: "Failed to fetch part" }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const numericId = Number(id)

    if (isNaN(numericId)) {
      return NextResponse.json({ error: "Invalid part ID" }, { status: 400 })
    }

    const body = await request.json()
    const { partName, compatibility, stockQty, lowStockThreshold, costPrice, sellingPrice, accountId } = body

    const [current] = await db
      .select()
      .from(inventory)
      .where(eq(inventory.id, numericId))
      .limit(1)

    if (!current) {
      return NextResponse.json({ error: "Part not found" }, { status: 404 })
    }

    const result = await db.transaction(async (tx) => {
      const updateData: Record<string, any> = {}
      if (partName !== undefined) updateData.partName = partName
      if (compatibility !== undefined) updateData.compatibility = compatibility
      if (lowStockThreshold !== undefined) updateData.lowStockThreshold = Number(lowStockThreshold)
      if (costPrice !== undefined) updateData.costPrice = String(costPrice)
      if (sellingPrice !== undefined) updateData.sellingPrice = String(sellingPrice)
      if (accountId !== undefined) updateData.accountId = accountId ? Number(accountId) : null
      if (stockQty !== undefined) updateData.stockQty = Number(stockQty)

      const [item] = await tx
        .update(inventory)
        .set(updateData)
        .where(eq(inventory.id, numericId))
        .returning()

      const newQty = stockQty !== undefined ? Number(stockQty) : Number(current.stockQty)
      const oldQty = Number(current.stockQty)
      const increase = newQty - oldQty

      if (increase > 0) {
        const resolvedCostPrice = costPrice !== undefined ? parseFloat(String(costPrice)) : parseFloat(String(current.costPrice ?? "0"))
        const resolvedAccountId = accountId !== undefined
          ? (accountId ? Number(accountId) : null)
          : current.accountId

        if (resolvedCostPrice > 0 && resolvedAccountId) {
          const totalCost = increase * resolvedCostPrice

          await tx
            .update(accounts)
            .set({ balance: sql`${accounts.balance} - ${totalCost}` })
            .where(eq(accounts.id, resolvedAccountId))

          await insertTransaction(
            resolvedAccountId,
            "debit",
            totalCost,
            `Purchased ${increase}x ${item.partName} (SKU: ${item.sku})`,
            "inventory_purchase",
            String(item.id),
            tx,
          )
        }
      }

      return item
    })

    return NextResponse.json({ item: result })
  } catch {
    return NextResponse.json({ error: "Failed to update part" }, { status: 500 })
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const numericId = Number(id)

    if (isNaN(numericId)) {
      return NextResponse.json({ error: "Invalid part ID" }, { status: 400 })
    }

    const [item] = await db
      .delete(inventory)
      .where(eq(inventory.id, numericId))
      .returning()

    if (!item) {
      return NextResponse.json({ error: "Part not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Failed to delete part" }, { status: 500 })
  }
}
