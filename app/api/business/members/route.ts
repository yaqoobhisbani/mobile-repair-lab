import { NextResponse } from "next/server"
import { db } from "@/db"
import { businessMembers, shareTransactions, businessAssets } from "@/db/schema"
import { eq, desc, sql } from "drizzle-orm"

export async function GET() {
  try {
    const members = await db
      .select({
        id: businessMembers.id,
        name: businessMembers.name,
        email: businessMembers.email,
        phone: businessMembers.phone,
        role: businessMembers.role,
        createdAt: businessMembers.createdAt,
        sharesOwned: sql<string>`
          COALESCE((SELECT SUM(shares_count::numeric) FROM share_transactions WHERE buyer_member_id = business_members.id), 0)
          -
          COALESCE((SELECT SUM(shares_count::numeric) FROM share_transactions WHERE seller_member_id = business_members.id), 0)
        `,
        assetCount: sql<number>`
          (SELECT COUNT(*)::int FROM business_assets WHERE purchased_by_member_id = business_members.id)
        `,
      })
      .from(businessMembers)
      .orderBy(desc(businessMembers.id))

    return NextResponse.json({ members })
  } catch {
    return NextResponse.json({ error: "Failed to fetch members" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, email, phone, role } = body

    if (!name?.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 })
    }

    const [member] = await db
      .insert(businessMembers)
      .values({
        name: name.trim(),
        email: email?.trim() || null,
        phone: phone?.trim() || null,
        role: role || "partner",
      })
      .returning()

    return NextResponse.json({ member }, { status: 201 })
  } catch {
    return NextResponse.json({ error: "Failed to create member" }, { status: 500 })
  }
}
