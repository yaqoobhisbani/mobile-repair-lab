import { NextResponse } from "next/server"
import { db } from "@/db"
import {
  businessMembers,
  shareTransactions,
  businessAssets,
} from "@/db/schema"
import { eq, desc, sql, and, or } from "drizzle-orm"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const numericId = Number(id)

    if (isNaN(numericId)) {
      return NextResponse.json({ error: "Invalid member ID" }, { status: 400 })
    }

    const [member] = await db
      .select()
      .from(businessMembers)
      .where(eq(businessMembers.id, numericId))
      .limit(1)

    if (!member) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 })
    }

    const [shareBalance] = await db
      .select({
        owned: sql<string>`
          COALESCE((SELECT SUM(shares_count::numeric) FROM share_transactions WHERE buyer_member_id = ${numericId}), 0)
          -
          COALESCE((SELECT SUM(shares_count::numeric) FROM share_transactions WHERE seller_member_id = ${numericId}), 0)
        `,
      })
      .from(shareTransactions)
      .where(
        or(
          eq(shareTransactions.buyerMemberId, numericId),
          eq(shareTransactions.sellerMemberId, numericId)
        )
      )

    const transactions = await db
      .select()
      .from(shareTransactions)
      .where(
        or(
          eq(shareTransactions.buyerMemberId, numericId),
          eq(shareTransactions.sellerMemberId, numericId)
        )
      )
      .orderBy(desc(shareTransactions.createdAt))

    const assets = await db
      .select()
      .from(businessAssets)
      .where(eq(businessAssets.purchasedByMemberId, numericId))
      .orderBy(desc(businessAssets.createdAt))

    return NextResponse.json({
      member,
      sharesOwned: shareBalance?.owned ?? "0",
      transactions,
      assets,
    })
  } catch {
    return NextResponse.json({ error: "Failed to fetch member" }, { status: 500 })
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
      return NextResponse.json({ error: "Invalid member ID" }, { status: 400 })
    }

    const body = await request.json()
    const { name, email, phone, role } = body

    const [member] = await db
      .update(businessMembers)
      .set({
        name: name?.trim() || undefined,
        email: email !== undefined ? (email?.trim() || null) : undefined,
        phone: phone !== undefined ? (phone?.trim() || null) : undefined,
        role: role || undefined,
      })
      .where(eq(businessMembers.id, numericId))
      .returning()

    if (!member) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 })
    }

    return NextResponse.json({ member })
  } catch {
    return NextResponse.json({ error: "Failed to update member" }, { status: 500 })
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
      return NextResponse.json({ error: "Invalid member ID" }, { status: 400 })
    }

    const [shareCheck] = await db
      .select({
        count: sql<number>`COALESCE(COUNT(*)::int, 0)`,
        balance: sql<string>`COALESCE(
          SUM(CASE WHEN seller_member_id = ${numericId} THEN shares_count::numeric ELSE 0 END)
          -
          SUM(CASE WHEN buyer_member_id = ${numericId} THEN shares_count::numeric ELSE 0 END)
        , 0)`,
      })
      .from(shareTransactions)
      .where(
        or(
          eq(shareTransactions.buyerMemberId, numericId),
          eq(shareTransactions.sellerMemberId, numericId)
        )
      )

    const [assetCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(businessAssets)
      .where(eq(businessAssets.purchasedByMemberId, numericId))

    if ((shareCheck?.count ?? 0) > 0) {
      return NextResponse.json(
        { error: "Cannot delete member: they have share transactions. Remove share holdings first." },
        { status: 400 }
      )
    }

    if ((assetCount?.count ?? 0) > 0) {
      return NextResponse.json(
        { error: `Cannot delete member: they own ${assetCount.count} asset(s). Reassign or remove assets first.` },
        { status: 400 }
      )
    }

    const [member] = await db
      .delete(businessMembers)
      .where(eq(businessMembers.id, numericId))
      .returning()

    if (!member) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Failed to delete member" }, { status: 500 })
  }
}
