import { NextResponse } from "next/server"
import { db } from "@/db"
import { ticketItems, inventory, tickets } from "@/db/schema"
import { eq, and, sql } from "drizzle-orm"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { inventoryId, quantityUsed } = body

    if (!inventoryId || !quantityUsed || quantityUsed < 1) {
      return NextResponse.json({ error: "Part and quantity are required" }, { status: 400 })
    }

    const [part] = await db
      .select()
      .from(inventory)
      .where(eq(inventory.id, inventoryId))
      .limit(1)

    if (!part) {
      return NextResponse.json({ error: "Part not found" }, { status: 404 })
    }

    if (part.stockQty < quantityUsed) {
      return NextResponse.json(
        { error: `Insufficient stock. Only ${part.stockQty} available.` },
        { status: 400 }
      )
    }

    const [existing] = await db
      .select()
      .from(ticketItems)
      .where(
        and(
          eq(ticketItems.ticketId, id),
          eq(ticketItems.inventoryId, inventoryId)
        )
      )
      .limit(1)

    let item
    if (existing) {
      const newQty = existing.quantityUsed + quantityUsed
      if (part.stockQty < newQty) {
        return NextResponse.json(
          { error: `Insufficient stock. Only ${part.stockQty} available (${existing.quantityUsed} already on this ticket).` },
          { status: 400 }
        )
      }
      item = await db.transaction(async (tx) => {
        const [i] = await tx
          .update(ticketItems)
          .set({ quantityUsed: newQty })
          .where(eq(ticketItems.id, existing.id))
          .returning()
        await tx
          .update(inventory)
          .set({ stockQty: part.stockQty - quantityUsed })
          .where(eq(inventory.id, inventoryId))
        return i
      })
    } else {
      item = await db.transaction(async (tx) => {
        const [i] = await tx
          .insert(ticketItems)
          .values({
            ticketId: id,
            inventoryId,
            quantityUsed,
          })
          .returning()
        await tx
          .update(inventory)
          .set({ stockQty: part.stockQty - quantityUsed })
          .where(eq(inventory.id, inventoryId))
        return i
      })
    }

    return NextResponse.json({ item }, { status: 201 })
  } catch {
    return NextResponse.json({ error: "Failed to add part" }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { itemId } = body

    if (!itemId) {
      return NextResponse.json({ error: "Item ID is required" }, { status: 400 })
    }

    const [item] = await db
      .select()
      .from(ticketItems)
      .where(
        and(
          eq(ticketItems.id, itemId),
          eq(ticketItems.ticketId, id)
        )
      )
      .limit(1)

    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 })
    }

    await db.transaction(async (tx) => {
      await tx
        .update(inventory)
        .set({ stockQty: sql`${inventory.stockQty} + ${item.quantityUsed}` })
        .where(eq(inventory.id, item.inventoryId))

      await tx
        .delete(ticketItems)
        .where(eq(ticketItems.id, itemId))
    })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Failed to remove part" }, { status: 500 })
  }
}
