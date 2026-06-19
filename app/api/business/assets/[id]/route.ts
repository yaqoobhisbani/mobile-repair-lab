import { NextResponse } from "next/server"
import { db } from "@/db"
import { businessAssets, businessMembers, shareTransactions, accounts } from "@/db/schema"
import { eq, desc, sql, or } from "drizzle-orm"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const numericId = Number(id)

    if (isNaN(numericId)) {
      return NextResponse.json({ error: "Invalid asset ID" }, { status: 400 })
    }

    const [asset] = await db
      .select()
      .from(businessAssets)
      .where(eq(businessAssets.id, numericId))
      .limit(1)

    if (!asset) {
      return NextResponse.json({ error: "Asset not found" }, { status: 404 })
    }

    return NextResponse.json({ asset })
  } catch {
    return NextResponse.json({ error: "Failed to fetch asset" }, { status: 500 })
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
      return NextResponse.json({ error: "Invalid asset ID" }, { status: 400 })
    }

    const body = await request.json()
    const { name, description, costPrice, purchaseDate, purchasedByMemberId, fundingSource, depreciationRate } = body

    const result = await db.transaction(async (tx) => {
      const [asset] = await tx
        .update(businessAssets)
        .set({
          name: name?.trim() || undefined,
          description: description !== undefined ? (description?.trim() || null) : undefined,
          costPrice: costPrice ? String(parseFloat(costPrice)) : undefined,
          purchaseDate: purchaseDate ? new Date(purchaseDate) : undefined,
          purchasedByMemberId: purchasedByMemberId !== undefined ? (purchasedByMemberId || null) : undefined,
          fundingSource: fundingSource || undefined,
          depreciationRate: depreciationRate !== undefined ? String(depreciationRate) : undefined,
        })
        .where(eq(businessAssets.id, numericId))
        .returning()

      if (!asset) {
        throw new Error("Asset not found")
      }

      if (fundingSource === "shop_funds") {
        const accountId = body.accountId
        if (accountId) {
          const [account] = await tx
            .select()
            .from(accounts)
            .where(eq(accounts.id, accountId))
            .limit(1)
          if (account && parseFloat(account.balance) >= parseFloat(costPrice)) {
            await tx
              .update(accounts)
              .set({
                balance: sql`${accounts.balance} - ${String(parseFloat(costPrice))}`,
              })
              .where(eq(accounts.id, accountId))
          }
        }
      }

      return asset
    })

    return NextResponse.json({ asset: result })
  } catch {
    return NextResponse.json({ error: "Failed to update asset" }, { status: 500 })
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
      return NextResponse.json({ error: "Invalid asset ID" }, { status: 400 })
    }

    const [asset] = await db
      .delete(businessAssets)
      .where(eq(businessAssets.id, numericId))
      .returning()

    if (!asset) {
      return NextResponse.json({ error: "Asset not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Failed to delete asset" }, { status: 500 })
  }
}
