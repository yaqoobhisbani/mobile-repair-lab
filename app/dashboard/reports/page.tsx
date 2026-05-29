"use client"

import { useState, useMemo, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { TrendingUp, Wrench, PackageCheck, CheckCircle2 } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { PageTransition, StaggerContainer, StaggerItem, HoverCard } from "@/components/page-transition"
import { AnimatedCounter } from "@/components/animated-counter"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid } from "recharts"
import { DatePicker } from "@/components/date-picker"
import { MonthPicker } from "@/components/month-picker"
import { useProfitReport } from "@/hooks/queries/use-profit-report"
import { PrivacyAmount } from "@/components/privacy-amount"

function formatPeriod(dateStr: string, period: string) {
  const d = new Date(dateStr)
  if (period === "yearly") return d.getFullYear().toString()
  if (period === "monthly") return d.toLocaleString("default", { month: "short", year: "2-digit" })
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

function formatCurrency(n: number) {
  return `Rs. ${n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

export default function ReportsPage() {
  const [datePeriod, setDatePeriod] = useState("monthly")
  const [referenceDate, setReferenceDate] = useState(new Date())

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
  }, [datePeriod, referenceDate])

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
      "Parts Profit": entry.partsProfit,
      "Labor Profit": entry.laborProfit,
      total: entry.totalProfit,
    }))
  }, [data, datePeriod])

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
          <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">Profit Report</h1>
          <p className="text-sm text-muted-foreground">Track earnings from labor and parts.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={datePeriod} onValueChange={(v) => { setDatePeriod(v); setReferenceDate(new Date()) }}>
            <SelectTrigger className="w-32 bg-white dark:bg-card">
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
            <DatePicker value={referenceDate} onChange={(d) => { if (d) setReferenceDate(d) }} className="h-9 w-40" />
          )}
          {datePeriod === "monthly" && (
            <MonthPicker value={referenceDate} onChange={(d) => setReferenceDate(d)} className="h-9 w-40" />
          )}
          {datePeriod === "yearly" && (
            <select
              value={referenceDate.getFullYear()}
              onChange={(e) => setReferenceDate(new Date(Number(e.target.value), 0, 1))}
              className="h-9 text-sm rounded-md border border-input bg-white dark:bg-card px-3 w-28"
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
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Skeleton className="h-24 w-full rounded-xl" />
            <Skeleton className="h-24 w-full rounded-xl" />
            <Skeleton className="h-24 w-full rounded-xl" />
            <Skeleton className="h-24 w-full rounded-xl" />
          </div>
          <Skeleton className="h-[400px] w-full rounded-xl" />
        </div>
      ) : (
        <>
          <StaggerContainer className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StaggerItem>
              <HoverCard>
                <Card className="bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-950/60 dark:to-background border-emerald-100 dark:border-emerald-900/50">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Total Profit</CardTitle>
                    <TrendingUp className="h-4 w-4 text-emerald-500" />
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-emerald-600"><PrivacyAmount>{formatCurrency(data?.summary?.totalProfit ?? 0)}</PrivacyAmount></p>
                  </CardContent>
                </Card>
              </HoverCard>
            </StaggerItem>
            <StaggerItem>
              <HoverCard>
                <Card className="bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/60 dark:to-background border-blue-100 dark:border-blue-900/50">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Parts Profit</CardTitle>
                    <PackageCheck className="h-4 w-4 text-blue-500" />
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold"><PrivacyAmount>{formatCurrency(data?.summary?.totalPartsProfit ?? 0)}</PrivacyAmount></p>
                  </CardContent>
                </Card>
              </HoverCard>
            </StaggerItem>
            <StaggerItem>
              <HoverCard>
                <Card className="bg-gradient-to-br from-violet-50 to-white dark:from-violet-950/60 dark:to-background border-violet-100 dark:border-violet-900/50">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Labor Profit</CardTitle>
                    <Wrench className="h-4 w-4 text-violet-500" />
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold"><PrivacyAmount>{formatCurrency(data?.summary?.totalLaborProfit ?? 0)}</PrivacyAmount></p>
                  </CardContent>
                </Card>
              </HoverCard>
            </StaggerItem>
            <StaggerItem>
              <HoverCard>
                <Card className="bg-gradient-to-br from-amber-50 to-white dark:from-amber-950/60 dark:to-background border-amber-100 dark:border-amber-900/50">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Tickets Completed</CardTitle>
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
              <CardTitle>Profit Breakdown</CardTitle>
              <CardDescription>
                {datePeriod === "daily" ? "Daily" : datePeriod === "monthly" ? "Monthly" : "Yearly"} profit from parts and labor.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {chartData.length === 0 ? (
                <div className="flex items-center justify-center h-[300px] text-sm text-muted-foreground">
                  No completed tickets with labor cost data found in this period.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="label" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                    <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar dataKey="Parts Profit" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Labor Profit" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
    </PageTransition>
  )
}
