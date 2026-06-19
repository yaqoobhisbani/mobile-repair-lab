import { NextResponse } from "next/server"
import { db } from "@/db"
import { dividendDistributions, businessMembers, shareTransactions, accounts } from "@/db/schema"
import { eq, desc, sql, or } from "drizzle-orm"

export async function GET() {
  try {
    const distributions = await db
      .select({
        id: dividendDistributions.id,
        memberId: dividendDistributions.memberId,
        memberName: businessMembers.name,
        amount: dividendDistributions.amount,
        payoutDate: dividendDistributions.payoutDate,
        shareholdingPercentage: dividendDistributions.shareholdingPercentage,
        notes: dividendDistributions.notes,
        createdAt: dividendDistributions.createdAt,
      })
      .from(dividendDistributions)
      .leftJoin(businessMembers, eq(dividendDistributions.memberId, businessMembers.id))
      .orderBy(desc(dividendDistributions.createdAt))

    return NextResponse.json({ distributions })
  } catch {
    return NextResponse.json({ error: "Failed to fetch dividends" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { totalAmount, notes } = body

    const amount = parseFloat(totalAmount)
    if (isNaN(amount) || amount <= 0) {
      return NextResponse.json({ error: "Valid total amount is required" }, { status: 400 })
    }

    const shareHolders = await db
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

    interface Holder {
      memberId: number
      memberName: string
      sharesBought: string
      sharesSold: string
    }

    const holdersWithBalance = shareHolders
      .map((h: Holder) => ({
        memberId: h.memberId,
        memberName: h.memberName,
        shares: parseFloat(h.sharesBought) - parseFloat(h.sharesSold),
      }))
      .filter((h) => h.shares > 0)

    const totalShares = holdersWithBalance.reduce((sum, h) => sum + h.shares, 0)

    if (totalShares <= 0) {
      return NextResponse.json({ error: "No shares outstanding to distribute dividends to" }, { status: 400 })
    }

    const distributions = await db.transaction(async (tx) => {
      const records = holdersWithBalance.map((h) => {
        const percentage = Math.round((h.shares / totalShares) * 10000) / 100
        return {
          memberId: h.memberId,
          amount: String(Math.round(amount * (h.shares / totalShares) * 100) / 100),
          shareholdingPercentage: String(percentage),
          notes: notes?.trim() || null,
        }
      })

      const inserted = []
      for (const rec of records) {
        const [d] = await tx.insert(dividendDistributions).values(rec).returning()
        inserted.push(d)
      }

      const accountId = body.accountId
      if (accountId) {
        const [account] = await tx
          .select()
          .from(accounts)
          .where(eq(accounts.id, accountId))
          .limit(1)
        if (account && parseFloat(account.balance) >= amount) {
          await tx
            .update(accounts)
            .set({
              balance: sql`${accounts.balance} - ${String(amount)}`,
            })
            .where(eq(accounts.id, accountId))
        }
      }

      return inserted
    })

    return NextResponse.json({ distributions }, { status: 201 })
  } catch {
    return NextResponse.json({ error: "Failed to distribute dividends" }, { status: 500 })
  }
}
