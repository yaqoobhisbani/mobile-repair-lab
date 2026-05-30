"use client"

import { useState, useMemo, useCallback } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { TrendingUp, Wrench, PackageCheck, CheckCircle2, Store, DollarSign, PiggyBank } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { PageTransition, StaggerContainer, StaggerItem, HoverCard } from "@/components/page-transition"
import { AnimatedCounter } from "@/components/animated-counter"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid } from "recharts"
import { DatePicker } from "@/components/date-picker"
import { MonthPicker } from "@/components/month-picker"
import { useProfitReport } from "@/hooks/queries/use-profit-report"
import { PrivacyAmount } from "@/components/privacy-amount"
import { cn } from "@/lib/utils"

function formatPeriod(dateStr: string, period: string) {
  const d = new Date(dateStr)
  if (period === "yearly") return d.getFullYear().toString()
  if (period === "monthly") return d.toLocaleString("default", { month: "short", year: "2-digit" })
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

function formatCurrency(n: number) {
  return `Rs. ${n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

export default function ReportsPage() {
  const [datePeriod, setDatePeriod] = useState("monthly")
  const [referenceDate, setReferenceDate] = useState(new Date())
  const [showProfit, setShowProfit] = useState(true)

  const getDateRange = useCallback(() => {
    const now = referenceDate
    switch (datePeriod) {
      case "daily": {
        const d = now.toISOString().split("T")[0]
        return { from: d, to: d }
      }
      case "monthly": {
        const y = now.getFullYear()
        const m = String(now.getMonth() + 1).padStart(2, "0")
        const lastDay = new Date(y, now.getMonth() + 1, 0).getDate()
        return { from: `${y}-${m}-01`, to: `${y}-${m}-${String(lastDay).padStart(2, "0")}` }
      }
      case "yearly":
        return { from: `${now.getFullYear()}-01-01`, to: `${now.getFullYear()}-12-31` }
      default:
        return null
    }
  }, [referenceDate])

  const params = useMemo(() => {
    const range = getDateRange()
    const apiPeriod = datePeriod === "all" ? "yearly" : datePeriod
    const p: Record<string, string> = { period: apiPeriod }
    if (range) {
      p.from = range.from
      p.to = range.to
    }
    return p
  }, [getDateRange, datePeriod])

  const { data, isLoading } = useProfitReport(params)

  const chartData = useMemo(() => {
    const d = data?.data ?? []
    return [...d].reverse().map((entry) => ({
      label: formatPeriod(entry.period, datePeriod),
      Parts: showProfit ? entry.partsProfit : entry.partsRevenue,
      Labor: showProfit ? entry.laborProfit : entry.laborRevenue,
      Sales: showProfit ? entry.salesProfit : entry.salesRevenue,
    }))
  }, [data, datePeriod, showProfit])

  const details = useMemo(() => data?.details ?? [], [data])

  const totalRevenue = data?.summary?.totalRevenue ?? 0
  const totalProfit = data?.summary?.totalProfit ?? 0

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload) return null
    return (
      <div className="rounded-lg border bg-background p-3 shadow-sm">
        <p className="text-sm font-medium mb-1">{label}</p>
        {payload.map((entry: any, i: number) => (
          <p key={i} className="text-xs" style={{ color: entry.color }}>
            {entry.name}: <PrivacyAmount>{formatCurrency(entry.value)}</PrivacyAmount>
          </p>
        ))}
      </div>
    )
  }

  return (
    <PageTransition>
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
            {showProfit ? "Profit Report" : "Revenue Report"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {showProfit
              ? "Net earnings after deducting parts cost."
              : "Total amount billed to customers."}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-lg border border-input bg-white dark:bg-card p-0.5">
            <button
              onClick={() => setShowProfit(false)}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                !showProfit ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <DollarSign className="h-3.5 w-3.5" />
              Revenue
            </button>
            <button
              onClick={() => setShowProfit(true)}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                showProfit ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <PiggyBank className="h-3.5 w-3.5" />
              Profit
            </button>
          </div>
          <Select value={datePeriod} onValueChange={(v) => { setDatePeriod(v); setReferenceDate(new Date()) }}>
            <SelectTrigger className="w-28 sm:w-32 bg-white dark:bg-card">
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
            <DatePicker value={referenceDate} onChange={(d) => { if (d) setReferenceDate(d) }} className="h-9 w-36 sm:w-40" />
          )}
          {datePeriod === "monthly" && (
            <MonthPicker value={referenceDate} onChange={(d) => setReferenceDate(d)} className="h-9 w-36 sm:w-40" />
          )}
          {datePeriod === "yearly" && (
            <select
              value={referenceDate.getFullYear()}
              onChange={(e) => setReferenceDate(new Date(Number(e.target.value), 0, 1))}
              className="h-9 text-sm rounded-md border border-input bg-white dark:bg-card px-3 w-24 sm:w-28"
            >
              {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 5 + i).map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <Skeleton className="h-24 w-full rounded-xl" />
            <Skeleton className="h-24 w-full rounded-xl" />
            <Skeleton className="h-24 w-full rounded-xl" />
            <Skeleton className="h-24 w-full rounded-xl" />
            <Skeleton className="h-24 w-full rounded-xl" />
          </div>
          <Skeleton className="h-[400px] w-full rounded-xl" />
          <Skeleton className="h-[300px] w-full rounded-xl" />
        </div>
      ) : (
        <>
          <StaggerContainer className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <StaggerItem>
              <HoverCard>
                <Card className="bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-950/60 dark:to-background border-emerald-100 dark:border-emerald-900/50">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      {showProfit ? "Total Profit" : "Total Revenue"}
                    </CardTitle>
                    <TrendingUp className="h-4 w-4 text-emerald-500" />
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-emerald-600">
                      <PrivacyAmount>{formatCurrency(showProfit ? totalProfit : totalRevenue)}</PrivacyAmount>
                    </p>
                  </CardContent>
                </Card>
              </HoverCard>
            </StaggerItem>
            <StaggerItem>
              <HoverCard>
                <Card className="bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/60 dark:to-background border-blue-100 dark:border-blue-900/50">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      {showProfit ? "Parts Profit" : "Parts Revenue"}
                    </CardTitle>
                    <PackageCheck className="h-4 w-4 text-blue-500" />
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">
                      <PrivacyAmount>{formatCurrency(showProfit ? data?.summary?.totalPartsProfit ?? 0 : data?.summary?.totalPartsRevenue ?? 0)}</PrivacyAmount>
                    </p>
                  </CardContent>
                </Card>
              </HoverCard>
            </StaggerItem>
            <StaggerItem>
              <HoverCard>
                <Card className="bg-gradient-to-br from-violet-50 to-white dark:from-violet-950/60 dark:to-background border-violet-100 dark:border-violet-900/50">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      {showProfit ? "Labor Profit" : "Labor Revenue"}
                    </CardTitle>
                    <Wrench className="h-4 w-4 text-violet-500" />
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">
                      <PrivacyAmount>{formatCurrency(showProfit ? data?.summary?.totalLaborProfit ?? 0 : data?.summary?.totalLaborRevenue ?? 0)}</PrivacyAmount>
                    </p>
                  </CardContent>
                </Card>
              </HoverCard>
            </StaggerItem>
            <StaggerItem>
              <HoverCard>
                <Card className="bg-gradient-to-br from-orange-50 to-white dark:from-orange-950/60 dark:to-background border-orange-100 dark:border-orange-900/50">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      {showProfit ? "Sales Profit" : "Sales Revenue"}
                    </CardTitle>
                    <Store className="h-4 w-4 text-orange-500" />
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">
                      <PrivacyAmount>{formatCurrency(showProfit ? data?.summary?.totalSalesProfit ?? 0 : data?.summary?.totalSalesRevenue ?? 0)}</PrivacyAmount>
                    </p>
                  </CardContent>
                </Card>
              </HoverCard>
            </StaggerItem>
            <StaggerItem>
              <HoverCard>
                <Card className="bg-gradient-to-br from-amber-50 to-white dark:from-amber-950/60 dark:to-background border-amber-100 dark:border-amber-900/50">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Jobs Completed</CardTitle>
                    <CheckCircle2 className="h-4 w-4 text-amber-500" />
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold"><AnimatedCounter to={data?.summary?.totalTickets ?? 0} /></p>
                  </CardContent>
                </Card>
              </HoverCard>
            </StaggerItem>
          </StaggerContainer>

          <Card>
            <CardHeader>
              <CardTitle>{showProfit ? "Profit" : "Revenue"} Breakdown</CardTitle>
              <CardDescription>
                {datePeriod === "daily" ? "Daily" : datePeriod === "monthly" ? "Monthly" : "Yearly"} {showProfit ? "profit" : "revenue"} from parts, labor, and sales.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {chartData.length === 0 ? (
                <div className="flex items-center justify-center h-[300px] text-sm text-muted-foreground">
                  No completed jobs or sales found in this period.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="label" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                    <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar dataKey="Parts" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Labor" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Sales" fill="#f97316" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Detail Breakdown</CardTitle>
              <CardDescription>Individual ticket and sale {showProfit ? "profit" : "revenue"} in this period.</CardDescription>
            </CardHeader>
            <CardContent className="p-0 sm:p-6">
              <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">{showProfit ? "Parts Profit" : "Parts Revenue"}</TableHead>
                    <TableHead className="text-right">{showProfit ? "Labor Profit" : "Labor Revenue"}</TableHead>
                    <TableHead className="text-right">{showProfit ? "Total Profit" : "Total Revenue"}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {details.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-6">
                        No completed jobs or sales in this period.
                      </TableCell>
                    </TableRow>
                  ) : (
                    details.map((d, i) => (
                      <TableRow key={`${d.type}-${d.id}-${i}`}>
                        <TableCell className="whitespace-nowrap text-sm">{formatDate(d.date)}</TableCell>
                        <TableCell>
                          <Badge variant={d.type === "ticket" ? "secondary" : "outline"}>
                            {d.type === "ticket" ? "Ticket" : "Sale"}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          <Link
                            href={d.type === "ticket" ? `/dashboard/tickets/${d.id}` : `/dashboard/sales/${d.id}`}
                            className="hover:underline font-medium"
                          >
                            {d.description}
                          </Link>
                        </TableCell>
                        <TableCell className="text-right whitespace-nowrap">
                          {(() => {
                            const val = showProfit ? d.profit.parts : d.revenue.parts
                            return val > 0 ? <PrivacyAmount>{formatCurrency(val)}</PrivacyAmount> : "—"
                          })()}
                        </TableCell>
                        <TableCell className="text-right whitespace-nowrap">
                          {(() => {
                            const val = showProfit ? d.profit.labor : d.revenue.labor
                            return val > 0 ? <PrivacyAmount>{formatCurrency(val)}</PrivacyAmount> : "—"
                          })()}
                        </TableCell>
                        <TableCell className="text-right whitespace-nowrap font-medium">
                          <PrivacyAmount>{formatCurrency(showProfit ? d.profit.total : d.revenue.total)}</PrivacyAmount>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
    </PageTransition>
  )
}
