import { NextResponse } from "next/server"
import { db } from "@/db"
import { inventory } from "@/db/schema"
import { desc, ilike, or } from "drizzle-orm"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search")
    const limit = searchParams.get("limit")

    let items
    if (search) {
      const q = db
        .select()
        .from(inventory)
        .where(
          or(
            ilike(inventory.partName, `%${search}%`),
            ilike(inventory.sku, `%${search}%`),
            ilike(inventory.compatibility, `%${search}%`),
          ),
        )
        .orderBy(desc(inventory.id))
      items = await (limit ? q.limit(Number(limit)) : q)
    } else {
      const q = db.select().from(inventory).orderBy(desc(inventory.id))
      items = await (limit ? q.limit(Number(limit)) : q)
    }

    return NextResponse.json({ items })
  } catch {
    return NextResponse.json({ error: "Failed to fetch inventory" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const { partName, sku, compatibility, stockQty, lowStockThreshold, costPrice, sellingPrice } = body

    if (!partName || !sku) {
      return NextResponse.json({ error: "Part name and SKU are required" }, { status: 400 })
    }

    const [item] = await db
      .insert(inventory)
      .values({
        partName,
        sku,
        compatibility: compatibility || null,
        stockQty: stockQty ? Number(stockQty) : 0,
        lowStockThreshold: lowStockThreshold ? Number(lowStockThreshold) : null,
        costPrice: costPrice ? String(costPrice) : null,
        sellingPrice: sellingPrice ? String(sellingPrice) : null,
      })
      .returning()

    return NextResponse.json({ item }, { status: 201 })
  } catch (error: any) {
    if (error?.code === "23505") {
      return NextResponse.json({ error: "A part with this SKU already exists" }, { status: 409 })
    }
    return NextResponse.json({ error: "Failed to create part" }, { status: 500 })
  }
}
