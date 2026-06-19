"use client"

import { use } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Loader2, Users, Package, ArrowLeftRight, Banknote } from "lucide-react"
import { PageTransition } from "@/components/page-transition"
import { AnimatedCounter } from "@/components/animated-counter"
import { PrivacyAmount } from "@/components/privacy-amount"
import { Skeleton } from "@/components/ui/skeleton"
import { useBusinessMember } from "@/hooks/queries/use-business-member"

export default function MemberDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const numericId = Number(id)
  const { data, isLoading } = useBusinessMember(numericId)

  function formatDate(d: string) {
    return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
  }

  function getTypeBadge(type: string) {
    const styles: Record<string, string> = {
      initial_issuance: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
      internal_transfer: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
      equity_withdrawal: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    }
    const labels: Record<string, string> = {
      initial_issuance: "Issuance",
      internal_transfer: "Transfer",
      equity_withdrawal: "Withdrawal",
    }
    return (
      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${styles[type] ?? ""}`}>
        {labels[type] ?? type}
      </span>
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28 w-full rounded-xl" />)}
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Member not found.</p>
        <Link href="/business/members"><Button variant="link">Back to Members</Button></Link>
      </div>
    )
  }

  const { member, sharesOwned, transactions, assets, dividends } = data
  const shares = parseFloat(sharesOwned)
  const equityValue = shares * 1000

  return (
    <PageTransition>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/business/members">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">{member.name}</h1>
            <p className="text-sm text-muted-foreground capitalize">{member.role}</p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="bg-gradient-to-br from-violet-50 to-white dark:from-violet-950/60 dark:to-background">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Shares Owned</CardTitle>
              <Users className="h-4 w-4 text-violet-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold"><AnimatedCounter to={shares} decimals={2} /></div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-950/60 dark:to-background">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Equity Value</CardTitle>
              <Banknote className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold"><PrivacyAmount>Rs. {equityValue.toLocaleString()}</PrivacyAmount></div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-cyan-50 to-white dark:from-cyan-950/60 dark:to-background">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Assets</CardTitle>
              <Package className="h-4 w-4 text-cyan-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold"><AnimatedCounter to={assets.length} /></div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Share Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              {transactions.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">No transactions yet.</p>
              ) : (
                <div className="space-y-3">
                  {transactions.map((tx) => (
                    <div key={tx.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                      <div>
                        <div className="flex items-center gap-2">
                          {getTypeBadge(tx.transactionType)}
                          <span className="text-sm font-medium">{parseFloat(tx.sharesCount).toFixed(2)} shares</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {tx.transactionType === "initial_issuance" && "Issued to member"}
                          {tx.transactionType === "internal_transfer" && (tx.sellerMemberId === numericId ? "Sold to another member" : "Bought from another member")}
                          {tx.transactionType === "equity_withdrawal" && "Withdrawn from member"}
                          {" · "}{formatDate(tx.transactionDate)}
                        </p>
                      </div>
                      <span className="text-sm font-medium">
                        <PrivacyAmount>Rs. {parseFloat(tx.totalAmount).toLocaleString()}</PrivacyAmount>
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Assets</CardTitle>
            </CardHeader>
            <CardContent>
              {assets.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">No assets contributed.</p>
              ) : (
                <div className="space-y-3">
                  {assets.map((asset) => (
                    <div key={asset.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                      <div>
                        <p className="text-sm font-medium">{asset.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {asset.fundingSource === "member_equity" ? "Member Equity" : "Shop Funds"}
                          {" · "}{formatDate(asset.createdAt)}
                        </p>
                      </div>
                      <span className="text-sm font-medium">
                        <PrivacyAmount>Rs. {parseFloat(asset.costPrice).toLocaleString()}</PrivacyAmount>
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {dividends.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Dividends Received</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="text-right">Shareholding %</TableHead>
                      <TableHead>Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dividends.map((d) => (
                      <TableRow key={d.id}>
                        <TableCell>{formatDate(d.payoutDate)}</TableCell>
                        <TableCell className="text-right font-medium">
                          <PrivacyAmount>Rs. {parseFloat(d.amount).toLocaleString()}</PrivacyAmount>
                        </TableCell>
                        <TableCell className="text-right">{d.shareholdingPercentage}%</TableCell>
                        <TableCell className="text-muted-foreground">{d.notes ?? "—"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </PageTransition>
  )
}
