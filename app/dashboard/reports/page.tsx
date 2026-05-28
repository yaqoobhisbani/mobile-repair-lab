"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { TrendingUp, Wrench, PackageCheck, CheckCircle2, Download, Calendar } from "lucide-react"
import { toast } from "sonner"
import { Skeleton } from "@/components/ui/skeleton"
import { PageTransition, StaggerContainer, StaggerItem, HoverCard } from "@/components/page-transition"
import { AnimatedCounter } from "@/components/animated-counter"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid } from "recharts"
import { DatePicker } from "@/components/date-picker"

interface ProfitEntry {
  period: string
  partsProfit: number
  laborProfit: number
  totalProfit: number
  ticketCount: number
}

interface Summary {
  totalPartsProfit: number
  totalLaborProfit: number
  totalProfit: number
  totalTickets: number
}

function formatPeriod(dateStr: string, period: string) {
  const d = new Date(dateStr)
  if (period === "yearly") return d.getFullYear().toString()
  if (period === "monthly") return d.toLocaleString("default", { month: "short", year: "2-digit" })
  if (period === "weekly") {
    const start = new Date(d)
    const end = new Date(d)
    end.setDate(end.getDate() + 6)
    return `${start.getDate()}/${start.getMonth() + 1}`
  }
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

function formatCurrency(n: number) {
  return `Rs. ${n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

export default function ReportsPage() {
  const [period, setPeriod] = useState("monthly")
  const [dateValue, setDateValue] = useState<Date>(new Date())
  const [monthValue, setMonthValue] = useState(() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
  })
  const [yearValue, setYearValue] = useState(() => String(new Date().getFullYear()))
  const [data, setData] = useState<ProfitEntry[]>([])
  const [summary, setSummary] = useState<Summary | null>(null)
  const [loading, setLoading] = useState(true)

  const buildUrl = useCallback(() => {
    const params = new URLSearchParams({ period })
    const dateStr = dateValue ? dateValue.toISOString().split("T")[0] : ""
    if (period === "daily" && dateStr) {
      params.set("from", dateStr)
      params.set("to", dateStr)
    } else if (period === "weekly" && dateStr) {
      const d = new Date(dateValue)
      const start = new Date(d)
      start.setDate(d.getDate() - d.getDay())
      const end = new Date(start)
      end.setDate(start.getDate() + 6)
      params.set("from", start.toISOString().split("T")[0])
      params.set("to", end.toISOString().split("T")[0])
    } else if (period === "monthly" && monthValue) {
      params.set("from", `${monthValue}-01`)
      const [y, m] = monthValue.split("-").map(Number)
      const lastDay = new Date(y, m, 0).getDate()
      params.set("to", `${monthValue}-${String(lastDay).padStart(2, "0")}`)
    } else if (period === "yearly" && yearValue) {
      params.set("from", `${yearValue}-01-01`)
      params.set("to", `${yearValue}-12-31`)
    }
    return `/api/reports/profit?${params.toString()}`
  }, [period, dateValue, monthValue, yearValue])

  useEffect(() => {
    setLoading(true)
    fetch(buildUrl())
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch")
        return res.json()
      })
      .then((result) => {
        setData(result.data ?? [])
        setSummary(result.summary ?? null)
      })
      .catch(() => toast.error("Failed to load profit report"))
      .finally(() => setLoading(false))
  }, [buildUrl])

  const chartData = useMemo(() => {
    return [...data].reverse().map((d) => ({
      label: formatPeriod(d.period, period),
      "Parts Profit": d.partsProfit,
      "Labor Profit": d.laborProfit,
      total: d.totalProfit,
    }))
  }, [data, period])

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload) return null
    return (
      <div className="rounded-lg border bg-background p-3 shadow-sm">
        <p className="text-sm font-medium mb-1">{label}</p>
        {payload.map((entry: any, i: number) => (
          <p key={i} className="text-xs" style={{ color: entry.color }}>
            {entry.name}: {formatCurrency(entry.value)}
          </p>
        ))}
      </div>
    )
  }

  function exportCSV() {
    if (data.length === 0) return
    const rows = [["Period", "Parts Profit", "Labor Profit", "Total Profit", "Tickets"].join(",")]
    data.forEach((d) => {
      rows.push([formatPeriod(d.period, period), d.partsProfit, d.laborProfit, d.totalProfit, d.ticketCount].join(","))
    })
    const blob = new Blob([rows.join("\n")], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `profit-report-${period}-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <PageTransition>
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">Profit Report</h1>
          <p className="text-muted-foreground">Track earnings from labor and parts.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 bg-muted rounded-lg p-0.5">
            {["weekly", "monthly", "yearly"].map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                  period === p ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
            <button
              onClick={() => setPeriod("daily")}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                period === "daily" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Calendar className="h-3.5 w-3.5 inline mr-1" />
              Custom
            </button>
          </div>

          <div className="flex items-center gap-2">
            {period === "daily" && (
              <DatePicker value={dateValue} onChange={(d) => d && setDateValue(d)} className="w-36 h-9" />
            )}
            {period === "weekly" && (
              <DatePicker value={dateValue} onChange={(d) => d && setDateValue(d)} className="w-36 h-9" />
            )}
            {period === "monthly" && (
              <Input type="month" value={monthValue} onChange={(e) => setMonthValue(e.target.value)} className="w-36 h-9" />
            )}
            {period === "yearly" && (
              <Input type="number" min="2000" max="2099" value={yearValue} onChange={(e) => setYearValue(e.target.value)} className="w-28 h-9" />
            )}

            <Button variant="outline" size="sm" onClick={exportCSV} disabled={data.length === 0} title="Download CSV">
              <Download className="h-3.5 w-3.5 mr-1.5" />
              Export
            </Button>
          </div>
        </div>
      </div>

      {loading ? (
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
                    <p className="text-2xl font-bold text-emerald-600">{formatCurrency(summary?.totalProfit ?? 0)}</p>
                  </CardContent>
                </Card>
              </HoverCard>
            </StaggerItem>
            <StaggerItem>
              <HoverCard>
                <Card className="bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/60 dark:to-background border-blue-100 dark:border-blue-900/50">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Labor / Service Fee</CardTitle>
                    <Wrench className="h-4 w-4 text-blue-500" />
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-blue-600">{formatCurrency(summary?.totalLaborProfit ?? 0)}</p>
                  </CardContent>
                </Card>
              </HoverCard>
            </StaggerItem>
            <StaggerItem>
              <HoverCard>
                <Card className="bg-gradient-to-br from-amber-50 to-white dark:from-amber-950/60 dark:to-background border-amber-100 dark:border-amber-900/50">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Parts Profit</CardTitle>
                    <PackageCheck className="h-4 w-4 text-amber-500" />
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-amber-600">{formatCurrency(summary?.totalPartsProfit ?? 0)}</p>
                  </CardContent>
                </Card>
              </HoverCard>
            </StaggerItem>
            <StaggerItem>
              <HoverCard>
                <Card className="bg-gradient-to-br from-violet-50 to-white dark:from-violet-950/60 dark:to-background border-violet-100 dark:border-violet-900/50">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Completed Tickets</CardTitle>
                    <CheckCircle2 className="h-4 w-4 text-violet-500" />
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold"><AnimatedCounter to={summary?.totalTickets ?? 0} /></p>
                  </CardContent>
                </Card>
              </HoverCard>
            </StaggerItem>
          </StaggerContainer>

          <Card>
            <CardHeader>
              <CardTitle>Profit Trend</CardTitle>
              <CardDescription>Parts profit vs labor profit over time.</CardDescription>
            </CardHeader>
            <CardContent>
              {chartData.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                  No completed tickets with labor cost yet. Complete some tickets to see profit data.
                </div>
              ) : (
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
                      <XAxis dataKey="label" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `Rs.${v}`} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Bar dataKey="Parts Profit" fill="#d97706" radius={[4, 4, 0, 0]} stackId="profit" />
                      <Bar dataKey="Labor Profit" fill="#2563eb" radius={[4, 4, 0, 0]} stackId="profit" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          {data.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Breakdown</CardTitle>
                <CardDescription>Detailed profit data by {period}.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-muted-foreground">
                        <th className="pb-3 font-medium">Period</th>
                        <th className="pb-3 font-medium text-right">Parts Profit</th>
                        <th className="pb-3 font-medium text-right">Labor Profit</th>
                        <th className="pb-3 font-medium text-right">Total Profit</th>
                        <th className="pb-3 font-medium text-right">Tickets</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.map((row) => (
                        <tr key={row.period} className="border-b last:border-0">
                          <td className="py-3 font-medium">{formatPeriod(row.period, period)}</td>
                          <td className="py-3 text-right text-amber-600">{formatCurrency(row.partsProfit)}</td>
                          <td className="py-3 text-right text-blue-600">{formatCurrency(row.laborProfit)}</td>
                          <td className="py-3 text-right font-medium text-emerald-600">{formatCurrency(row.totalProfit)}</td>
                          <td className="py-3 text-right">{row.ticketCount}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
    </PageTransition>
  )
}
