import { NextResponse } from "next/server"
import { db } from "@/db"
import {
  businessMembers,
  businessAssets,
  shareTransactions,
  accounts,
} from "@/db/schema"
import { eq, sql, or, desc } from "drizzle-orm"

export async function GET() {
  try {
    const [totalSharesResult] = await db
      .select({
        total: sql<string>`
          COALESCE((SELECT SUM(shares_count::numeric) FROM share_transactions WHERE buyer_member_id IS NOT NULL), 0)
          -
          COALESCE((SELECT SUM(shares_count::numeric) FROM share_transactions WHERE seller_member_id IS NOT NULL), 0)
        `,
      })
      .from(shareTransactions)

    const totalShares = parseFloat(totalSharesResult?.total ?? "0")

    const assets = await db.select().from(businessAssets)

    const totalAssetValue = assets.reduce((sum, a) => {
      const cost = parseFloat(a.costPrice)
      const rate = parseFloat(a.depreciationRate || "0")
      if (rate > 0) {
        const years =
          (Date.now() - new Date(a.purchaseDate).getTime()) /
          (365.25 * 24 * 60 * 60 * 1000)
        const depreciated = cost * (1 - (rate / 100) * years)
        return sum + Math.max(0, depreciated)
      }
      return sum + cost
    }, 0)

    const allAccounts = await db.select().from(accounts)
    const totalShopCash = allAccounts.reduce(
      (sum, a) => sum + parseFloat(a.balance),
      0
    )

    const navPerShare =
      totalShares > 0
        ? totalAssetValue / totalShares
        : 0

    const memberShares = await db
      .select({
        memberId: businessMembers.id,
        memberName: businessMembers.name,
        sharesBought: sql<string>`COALESCE(
          (SELECT SUM(shares_count::numeric) FROM share_transactions WHERE buyer_member_id = business_members.id),
        0)`,
        sharesSold: sql<string>`COALESCE(
          (SELECT SUM(shares_count::numeric) FROM share_transactions WHERE seller_member_id = business_members.id),
        0)`,
      })
      .from(businessMembers)

    const memberCount = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(businessMembers)

    const recentTransactions = await db
      .select({
        id: shareTransactions.id,
        transactionType: shareTransactions.transactionType,
        sharesCount: shareTransactions.sharesCount,
        totalAmount: shareTransactions.totalAmount,
        transactionDate: shareTransactions.transactionDate,
      })
      .from(shareTransactions)
      .orderBy(desc(shareTransactions.createdAt))
      .limit(10)

    return NextResponse.json({
      totalShares: String(totalShares),
      totalAssetValue: String(Math.round(totalAssetValue * 100) / 100),
      totalShopCash: String(totalShopCash),
      navPerShare: String(navPerShare > 0 ? Math.round(navPerShare * 100) / 100 : "0"),
      memberCount: memberCount[0]?.count ?? 0,
      shareholding: memberShares.map((m) => {
        const shares = parseFloat(m.sharesBought) - parseFloat(m.sharesSold)
        return {
          memberId: m.memberId,
          memberName: m.memberName,
          sharesOwned: String(shares),
          ownershipPercent:
            totalShares > 0
              ? String(Math.round((shares / totalShares) * 10000) / 100)
              : "0",
        }
      }),
      recentTransactions,
    })
  } catch {
    return NextResponse.json({ error: "Failed to fetch business dashboard" }, { status: 500 })
  }
}
