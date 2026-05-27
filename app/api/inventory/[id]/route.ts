import { NextResponse } from "next/server"
import { db } from "@/db"
import { inventory } from "@/db/schema"
import { eq } from "drizzle-orm"

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
    const { partName, compatibility, stockQty, lowStockThreshold, costPrice, sellingPrice } = body

    const [item] = await db
      .update(inventory)
      .set({
        partName: partName || undefined,
        compatibility: compatibility !== undefined ? compatibility : undefined,
        stockQty: stockQty !== undefined ? Number(stockQty) : undefined,
        lowStockThreshold: lowStockThreshold !== undefined ? Number(lowStockThreshold) : undefined,
        costPrice: costPrice !== undefined ? String(costPrice) : undefined,
        sellingPrice: sellingPrice !== undefined ? String(sellingPrice) : undefined,
      })
      .where(eq(inventory.id, numericId))
      .returning()

    if (!item) {
      return NextResponse.json({ error: "Part not found" }, { status: 404 })
    }

    return NextResponse.json({ item })
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
