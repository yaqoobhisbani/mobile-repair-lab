import { NextResponse } from "next/server"
import { db } from "@/db"
import { saleOrders, saleItems, inventory, accounts, customers } from "@/db/schema"
import { eq, sql } from "drizzle-orm"
import { insertTransaction } from "@/db/transactions"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const [sale] = await db
      .select({
        id: saleOrders.id,
        customerId: saleOrders.customerId,
        customerName: saleOrders.customerName,
        customerPhone: saleOrders.customerPhone,
        paymentAccountId: saleOrders.paymentAccountId,
        paymentAccountName: accounts.name,
        paymentAccountType: accounts.type,
        totalAmount: saleOrders.totalAmount,
        createdAt: saleOrders.createdAt,
      })
      .from(saleOrders)
      .leftJoin(accounts, eq(saleOrders.paymentAccountId, accounts.id))
      .where(eq(saleOrders.id, id))
      .limit(1)

    if (!sale) {
      return NextResponse.json({ error: "Sale not found" }, { status: 404 })
    }

    const items = await db
      .select({
        id: saleItems.id,
        inventoryId: saleItems.inventoryId,
        partName: inventory.partName,
        sku: inventory.sku,
        quantity: saleItems.quantity,
        unitPrice: saleItems.unitPrice,
      })
      .from(saleItems)
      .leftJoin(inventory, eq(saleItems.inventoryId, inventory.id))
      .where(eq(saleItems.saleId, id))

    return NextResponse.json({ sale, items })
  } catch {
    return NextResponse.json({ error: "Failed to fetch sale" }, { status: 500 })
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const [sale] = await db
      .select()
      .from(saleOrders)
      .where(eq(saleOrders.id, id))
      .limit(1)

    if (!sale) {
      return NextResponse.json({ error: "Sale not found" }, { status: 404 })
    }

    await db.transaction(async (tx) => {
      const items = await tx
        .select()
        .from(saleItems)
        .where(eq(saleItems.saleId, id))

      for (const item of items) {
        await tx
          .update(inventory)
          .set({ stockQty: sql`${inventory.stockQty} + ${item.quantity}` })
          .where(eq(inventory.id, item.inventoryId))
      }

      await tx
        .update(accounts)
        .set({ balance: sql`${accounts.balance} - ${sale.totalAmount}` })
        .where(eq(accounts.id, sale.paymentAccountId))

      await insertTransaction(
        sale.paymentAccountId,
        "debit",
        parseFloat(sale.totalAmount),
        `Reversed Sale ${id}`,
        "sale",
        id,
        tx,
      )

      await tx.delete(saleItems).where(eq(saleItems.saleId, id))
      await tx.delete(saleOrders).where(eq(saleOrders.id, id))
    })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Failed to delete sale" }, { status: 500 })
  }
}
