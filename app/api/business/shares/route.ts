import { NextResponse } from "next/server"
import { db } from "@/db"
import { shareTransactions, businessMembers } from "@/db/schema"
import { eq, desc, sql, or } from "drizzle-orm"
import { alias } from "drizzle-orm/pg-core"

const buyer = alias(businessMembers, "buyer")
const seller = alias(businessMembers, "seller")

export async function GET() {
  try {
    const transactions = await db
      .select({
        id: shareTransactions.id,
        transactionType: shareTransactions.transactionType,
        sellerMemberId: shareTransactions.sellerMemberId,
        sellerName: seller.name,
        buyerMemberId: shareTransactions.buyerMemberId,
        buyerName: buyer.name,
        sharesCount: shareTransactions.sharesCount,
        pricePerShare: shareTransactions.pricePerShare,
        totalAmount: shareTransactions.totalAmount,
        transactionDate: shareTransactions.transactionDate,
        notes: shareTransactions.notes,
        createdAt: shareTransactions.createdAt,
      })
      .from(shareTransactions)
      .leftJoin(seller, eq(shareTransactions.sellerMemberId, seller.id))
      .leftJoin(buyer, eq(shareTransactions.buyerMemberId, buyer.id))

    return NextResponse.json({ transactions })
  } catch {
    return NextResponse.json({ error: "Failed to fetch share transactions" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { transactionType, sellerMemberId, buyerMemberId, sharesCount, pricePerShare, notes } = body

    if (!transactionType) {
      return NextResponse.json({ error: "Transaction type is required" }, { status: 400 })
    }

    if (!["initial_issuance", "internal_transfer", "equity_withdrawal"].includes(transactionType)) {
      return NextResponse.json({ error: "Invalid transaction type" }, { status: 400 })
    }

    const count = parseFloat(sharesCount)
    if (isNaN(count) || count <= 0) {
      return NextResponse.json({ error: "Shares count must be greater than 0" }, { status: 400 })
    }

    if (transactionType === "internal_transfer") {
      if (!sellerMemberId || !buyerMemberId) {
        return NextResponse.json(
          { error: "Both seller and buyer are required for internal transfer" },
          { status: 400 }
        )
      }

      const [sellerBalance] = await db
        .select({
          balance: sql<string>`
            COALESCE((SELECT SUM(shares_count::numeric) FROM share_transactions WHERE buyer_member_id = ${sellerMemberId}), 0)
            -
            COALESCE((SELECT SUM(shares_count::numeric) FROM share_transactions WHERE seller_member_id = ${sellerMemberId}), 0)
          `,
        })
        .from(shareTransactions)
        .where(
          or(
            eq(shareTransactions.buyerMemberId, sellerMemberId),
            eq(shareTransactions.sellerMemberId, sellerMemberId)
          )
        )

      const available = parseFloat(sellerBalance?.balance ?? "0")
      if (count > available) {
        return NextResponse.json(
          { error: `Insufficient shares. Seller has ${available} shares, attempted to transfer ${count}.` },
          { status: 400 }
        )
      }
    }

    if (transactionType === "initial_issuance" && sellerMemberId) {
      return NextResponse.json(
        { error: "Initial issuance should not have a seller" },
        { status: 400 }
      )
    }

    const price = parseFloat(pricePerShare || "1000")
    const totalAmount = count * price

    const [transaction] = await db
      .insert(shareTransactions)
      .values({
        transactionType,
        sellerMemberId: sellerMemberId || null,
        buyerMemberId: buyerMemberId || null,
        sharesCount: String(count),
        pricePerShare: String(price),
        totalAmount: String(totalAmount),
        notes: notes?.trim() || null,
      })
      .returning()

    return NextResponse.json({ transaction }, { status: 201 })
  } catch {
    return NextResponse.json({ error: "Failed to create share transaction" }, { status: 500 })
  }
}
