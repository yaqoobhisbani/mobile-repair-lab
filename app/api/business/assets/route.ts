import { NextResponse } from "next/server"
import { db } from "@/db"
import { businessAssets, businessMembers, shareTransactions, accounts } from "@/db/schema"
import { eq, desc, sql } from "drizzle-orm"

function calculateDepreciatedValue(
  costPrice: string,
  depreciationRate: string | null,
  purchaseDate: Date
): number {
  const cost = parseFloat(costPrice)
  const rate = parseFloat(depreciationRate || "0")
  if (rate === 0) return cost
  const years =
    (Date.now() - new Date(purchaseDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000)
  const depreciated = cost * (1 - (rate / 100) * years)
  return Math.max(0, Math.round(depreciated * 100) / 100)
}

export async function GET() {
  try {
    const rows = await db
      .select({
        id: businessAssets.id,
        name: businessAssets.name,
        description: businessAssets.description,
        costPrice: businessAssets.costPrice,
        purchaseDate: businessAssets.purchaseDate,
        purchasedByMemberId: businessAssets.purchasedByMemberId,
        purchasedByName: businessMembers.name,
        fundingSource: businessAssets.fundingSource,
        depreciationRate: businessAssets.depreciationRate,
        createdAt: businessAssets.createdAt,
      })
      .from(businessAssets)
      .leftJoin(businessMembers, eq(businessAssets.purchasedByMemberId, businessMembers.id))
      .orderBy(desc(businessAssets.createdAt))

    const assets = rows.map((a) => ({
      ...a,
      currentValue: String(
        calculateDepreciatedValue(a.costPrice, a.depreciationRate, new Date(a.purchaseDate))
      ),
    }))

    return NextResponse.json({ assets })
  } catch {
    return NextResponse.json({ error: "Failed to fetch assets" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      name,
      description,
      costPrice,
      purchaseDate,
      purchasedByMemberId,
      fundingSource,
      depreciationRate,
    } = body

    if (!name?.trim()) {
      return NextResponse.json({ error: "Asset name is required" }, { status: 400 })
    }

    const price = parseFloat(costPrice)
    if (isNaN(price) || price <= 0) {
      return NextResponse.json({ error: "Valid cost price is required" }, { status: 400 })
    }

    if (fundingSource === "member_equity" && !purchasedByMemberId) {
      return NextResponse.json(
        { error: "Purchased by member is required when funding source is member equity" },
        { status: 400 }
      )
    }

    const result = await db.transaction(async (tx) => {
      const [asset] = await tx
        .insert(businessAssets)
        .values({
          name: name.trim(),
          description: description?.trim() || null,
          costPrice: String(price),
          purchaseDate: purchaseDate ? new Date(purchaseDate) : new Date(),
          purchasedByMemberId: purchasedByMemberId || null,
          fundingSource: fundingSource || "member_equity",
          depreciationRate: depreciationRate ? String(depreciationRate) : "0.00",
        })
        .returning()

      if (fundingSource === "member_equity" && purchasedByMemberId) {
        const sharesCount = price / 1000
        if (sharesCount > 0) {
          await tx.insert(shareTransactions).values({
            transactionType: "initial_issuance",
            sellerMemberId: null,
            buyerMemberId: purchasedByMemberId,
            sharesCount: String(sharesCount),
            pricePerShare: "1000.00",
            totalAmount: String(price),
            notes: `Auto-issued for asset: ${name.trim()}`,
          })
        }
      }

      if (fundingSource === "shop_funds") {
        const accountId = body.accountId
        if (accountId) {
          const [account] = await tx
            .select()
            .from(accounts)
            .where(eq(accounts.id, accountId))
            .limit(1)
          if (account && parseFloat(account.balance) >= price) {
            await tx
              .update(accounts)
              .set({
                balance: sql`${accounts.balance} - ${String(price)}`,
              })
              .where(eq(accounts.id, accountId))
          }
        }
      }

      return asset
    })

    return NextResponse.json({ asset: result }, { status: 201 })
  } catch {
    return NextResponse.json({ error: "Failed to create asset" }, { status: 500 })
  }
}
