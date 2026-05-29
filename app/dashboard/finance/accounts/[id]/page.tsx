"use client"

import { useState, use, useMemo } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Landmark, ArrowUpRight, ArrowDownRight, ExternalLink } from "lucide-react"
import { Loader2 } from "lucide-react"
import { PageTransition } from "@/components/page-transition"
import { DataTablePagination } from "@/components/data-table-pagination"
import { DatePicker } from "@/components/date-picker"
import { MonthPicker } from "@/components/month-picker"
import { PrivacyAmount } from "@/components/privacy-amount"
import { startOfMonth, endOfMonth, startOfYear, endOfYear, isWithinInterval, parseISO } from "date-fns"
import { useAccount } from "@/hooks/queries/use-account"
import { useTransactions } from "@/hooks/queries/use-transactions"

const typeLabels: Record<string, string> = {
  bank: "Bank Account",
  cash: "Cash",
}

const referenceLinks: Record<string, string> = {
  ticket: "/dashboard/tickets/",
  expense: "",
  opening_balance: "",
}

export default function ViewAccountPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [datePeriod, setDatePeriod] = useState("all")
  const [referenceDate, setReferenceDate] = useState(new Date())
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const { data: account, isLoading: loadingAccount } = useAccount(Number(id))
  const { data: transactions = [], isLoading: loadingTx } = useTransactions(Number(id))
  const loading = loadingAccount || loadingTx

  const getDateRange = useMemo(() => {
    const ref = referenceDate
    switch (datePeriod) {
      case "daily": {
        const start = new Date(ref)
        start.setHours(0, 0, 0, 0)
        const end = new Date(ref)
        end.setHours(23, 59, 59, 999)
        return { start, end }
      }
      case "yearly": {
        const start = startOfYear(ref)
        start.setHours(0, 0, 0, 0)
        const end = endOfYear(ref)
        end.setHours(23, 59, 59, 999)
        return { start, end }
      }
      case "monthly":
      default: {
        const start = startOfMonth(ref)
        start.setHours(0, 0, 0, 0)
        const end = endOfMonth(ref)
        end.setHours(23, 59, 59, 999)
        return { start, end }
      }
    }
  }, [datePeriod, referenceDate])

  const filteredTransactions = useMemo(() => {
    if (datePeriod === "all") return transactions
    const range = getDateRange
    return transactions.filter((t) => {
      const date = parseISO(t.createdAt)
      return isWithinInterval(date, { start: range.start, end: range.end })
    })
  }, [transactions, datePeriod, getDateRange])

  const totalPages = Math.max(1, Math.ceil(filteredTransactions.length / pageSize))
  const safePage = Math.min(page, totalPages)
  const paginated = filteredTransactions.slice((safePage - 1) * pageSize, safePage * pageSize)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!account) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4">
        <Landmark className="h-12 w-12 text-muted-foreground" />
        <p className="text-lg font-medium">Account not found</p>
        <Button variant="outline" onClick={() => router.push("/dashboard/finance/accounts")}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Accounts
        </Button>
      </div>
    )
  }

  const totalCredits = filteredTransactions
    .filter((t) => t.type === "credit")
    .reduce((s, t) => s + parseFloat(t.amount), 0)

  const totalDebits = filteredTransactions
    .filter((t) => t.type === "debit")
    .reduce((s, t) => s + parseFloat(t.amount), 0)

  return (
    <PageTransition>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/finance/accounts">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-emerald-500 to-cyan-500 bg-clip-text text-transparent">
              {account.name}
            </h1>
            <p className="text-muted-foreground">{typeLabels[account.type]}</p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Current Balance</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">Rs. <PrivacyAmount>{parseFloat(account.balance).toLocaleString("en-US", { minimumFractionDigits: 2 })}</PrivacyAmount></p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Credits</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-emerald-600 inline-flex items-center gap-1"><ArrowUpRight className="h-5 w-5" />Rs. <PrivacyAmount>{totalCredits.toLocaleString("en-US", { minimumFractionDigits: 2 })}</PrivacyAmount></p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Debits</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-rose-600 inline-flex items-center gap-1"><ArrowDownRight className="h-5 w-5" />Rs. <PrivacyAmount>{totalDebits.toLocaleString("en-US", { minimumFractionDigits: 2 })}</PrivacyAmount></p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{filteredTransactions.length}</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <CardTitle>Transaction History</CardTitle>
              <div className="flex items-center gap-2 flex-wrap">
                <Select value={datePeriod} onValueChange={(v) => { setDatePeriod(v); setReferenceDate(new Date()); setPage(1) }}>
                  <SelectTrigger className="w-24 sm:w-28 h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Today</SelectItem>
                    <SelectItem value="monthly">This Month</SelectItem>
                    <SelectItem value="yearly">This Year</SelectItem>
                    <SelectItem value="all">All</SelectItem>
                  </SelectContent>
                </Select>
                {datePeriod === "daily" && (
                  <DatePicker value={referenceDate} onChange={(d) => { if (d) setReferenceDate(d) }} className="h-8 w-32 sm:w-36" />
                )}
                {datePeriod === "monthly" && (
                  <MonthPicker value={referenceDate} onChange={(d) => setReferenceDate(d)} className="h-8 w-32 sm:w-36" />
                )}
                {datePeriod === "yearly" && (
                  <select
                    value={referenceDate.getFullYear()}
                    onChange={(e) => setReferenceDate(new Date(Number(e.target.value), 0, 1))}
                    className="h-8 text-sm rounded-md border border-input bg-transparent px-2 w-20 sm:w-24"
                  >
                    {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 5 + i).map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredTransactions.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No transactions yet.</p>
            ) : (
              <><div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">Date</th>
                      <th className="text-left py-2 px-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">Description</th>
                      <th className="text-left py-2 px-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">Reference</th>
                      <th className="text-right py-2 px-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginated.map((t) => (
                      <tr key={t.id} className="border-b last:border-0 hover:bg-muted/50">
                        <td className="py-3 px-2 text-muted-foreground whitespace-nowrap">
                          {new Date(t.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>
                        <td className="py-3 px-2">{t.description}</td>
                        <td className="py-3 px-2">
                          {t.referenceType === "ticket" && t.referenceId ? (
                            <Link href={`/dashboard/tickets/${t.referenceId}`} className="inline-flex items-center gap-1 text-primary hover:underline">
                              {t.referenceId}
                              <ExternalLink className="h-3 w-3" />
                            </Link>
                          ) : t.referenceType === "sale" && t.referenceId ? (
                            <Link href={`/dashboard/sales/${t.referenceId}`} className="inline-flex items-center gap-1 text-primary hover:underline">
                              {t.referenceId}
                              <ExternalLink className="h-3 w-3" />
                            </Link>
                          ) : t.referenceType === "expense" ? (
                            <Badge variant="outline" className="text-xs">Expense</Badge>
                          ) : t.referenceType === "top_up" ? (
                            <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-800">Top Up</Badge>
                          ) : t.referenceType === "transfer" && t.type === "debit" ? (
                            <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-400 dark:border-blue-800">Transfer Out</Badge>
                          ) : t.referenceType === "transfer" && t.type === "credit" ? (
                            <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-400 dark:border-blue-800">Transfer In</Badge>
                          ) : t.referenceType === "inventory_purchase" ? (
                            <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-400 dark:border-purple-800">Stock Purchase</Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs">Opening</Badge>
                          )}
                        </td>
                        <td className="py-3 px-2 text-right whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 font-medium ${t.type === "credit" ? "text-emerald-600" : "text-rose-600"}`}>
                            {t.type === "credit" ? (
                              <ArrowUpRight className="h-3.5 w-3.5" />
                            ) : (
                              <ArrowDownRight className="h-3.5 w-3.5" />
                            )}
                            Rs. <PrivacyAmount>{parseFloat(t.amount).toLocaleString("en-US", { minimumFractionDigits: 2 })}</PrivacyAmount>
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <DataTablePagination
                currentPage={safePage}
                totalPages={totalPages}
                totalItems={filteredTransactions.length}
                pageSize={pageSize}
                onPageChange={setPage}
                onPageSizeChange={setPageSize}
              /></>
            )}
          </CardContent>
        </Card>
      </div>
    </PageTransition>
  )
}
