"use client"

import { useMemo } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Briefcase, Users, ArrowLeftRight, Banknote, ArrowRight } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { PageTransition, StaggerContainer, StaggerItem, HoverCard } from "@/components/page-transition"
import { AnimatedCounter } from "@/components/animated-counter"
import { PrivacyAmount } from "@/components/privacy-amount"
import { useBusinessDashboard } from "@/hooks/queries/use-business-dashboard"
import { useNavPrice } from "@/hooks/queries/use-nav-price"
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid } from "recharts"

const COLORS = ["#06b6d4", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444", "#ec4899", "#6366f1", "#14b8a6"]

export default function BusinessOverview() {
  const { data: dashboard, isLoading } = useBusinessDashboard()
  const navPrice = useNavPrice()

  const pieData = useMemo(() => {
    if (!dashboard?.shareholding) return []
    return dashboard.shareholding
      .filter((s) => parseFloat(s.sharesOwned) > 0)
      .map((s) => ({
        name: s.memberName,
        value: parseFloat(s.sharesOwned),
        percent: s.ownershipPercent,
      }))
  }, [dashboard])

  const barData = useMemo(() => {
    if (!dashboard) return []
    const totalVal = parseFloat(dashboard.totalAssetValue)
    return [
      { name: "Total Assets", value: totalVal },
    ]
  }, [dashboard])

  const shareholdingRows = useMemo(() => {
    if (!dashboard?.shareholding) return []
    return dashboard.shareholding.filter((s) => parseFloat(s.sharesOwned) > 0)
  }, [dashboard])

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-72" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-xl" />
          ))}
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <Skeleton className="h-80 w-full rounded-xl" />
          <Skeleton className="h-80 w-full rounded-xl" />
        </div>
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    )
  }

  return (
    <PageTransition>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-600 to-teal-600 bg-clip-text text-transparent">Business Overview</h1>
          <p className="text-sm text-muted-foreground">Track capital partners, assets, equity, and shareholding.</p>
        </div>

        <StaggerContainer className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StaggerItem>
            <HoverCard>
              <Card className="bg-gradient-to-br from-cyan-50 to-white dark:from-cyan-950/60 dark:to-background border-cyan-200 dark:border-cyan-800">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Valuation</CardTitle>
                  <Briefcase className="h-4 w-4 text-cyan-500" />
                </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                Rs. <PrivacyAmount><AnimatedCounter to={parseFloat(dashboard?.totalAssetValue ?? "0") + parseFloat(dashboard?.totalShopCash ?? "0")} decimals={2} /></PrivacyAmount>
              </div>
              <p className="text-xs text-muted-foreground">Assets + Shop Cash</p>
            </CardContent>
              </Card>
            </HoverCard>
          </StaggerItem>
          <StaggerItem>
            <HoverCard>
              <Card className="bg-gradient-to-br from-violet-50 to-white dark:from-violet-950/60 dark:to-background border-violet-200 dark:border-violet-800">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Shares</CardTitle>
                  <ArrowLeftRight className="h-4 w-4 text-violet-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    <AnimatedCounter to={parseFloat(dashboard?.totalShares ?? "0")} decimals={2} />
                  </div>
                  <p className="text-xs text-muted-foreground">Outstanding equity shares</p>
                </CardContent>
              </Card>
            </HoverCard>
          </StaggerItem>
          <StaggerItem>
            <HoverCard>
              <Card className="bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-950/60 dark:to-background border-emerald-200 dark:border-emerald-800">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">NAV Per Share</CardTitle>
                  <Banknote className="h-4 w-4 text-emerald-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    Rs. <PrivacyAmount><AnimatedCounter to={parseFloat(dashboard?.navPerShare ?? "0")} decimals={2} /></PrivacyAmount>
                  </div>
                  <p className="text-xs text-muted-foreground">Net Asset Value per share</p>
                </CardContent>
              </Card>
            </HoverCard>
          </StaggerItem>
          <StaggerItem>
            <HoverCard>
              <Card className="bg-gradient-to-br from-amber-50 to-white dark:from-amber-950/60 dark:to-background border-amber-200 dark:border-amber-800">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Active Members</CardTitle>
                  <Users className="h-4 w-4 text-amber-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    <AnimatedCounter to={dashboard?.memberCount ?? 0} />
                  </div>
                  <p className="text-xs text-muted-foreground">Registered partners & investors</p>
                </CardContent>
              </Card>
            </HoverCard>
          </StaggerItem>
        </StaggerContainer>

        <StaggerContainer className="grid gap-4 lg:grid-cols-2">
          <StaggerItem className="min-w-0">
            <Card className="min-w-0 overflow-hidden">
              <CardHeader>
                <CardTitle className="text-base">Shareholding Distribution</CardTitle>
              </CardHeader>
              <CardContent className="overflow-hidden">
                {pieData.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-8 text-center">No shares issued yet.</p>
                ) : (
                  <div className="flex flex-col items-center w-full overflow-hidden">
                    <div className="w-full overflow-hidden">
                      <ResponsiveContainer width="100%" height={320}>
                        <PieChart margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
                          <Pie
                            data={pieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={55}
                            outerRadius={85}
                            dataKey="value"
                            nameKey="name"
                            label={({ name, percent }) => `${name} (${percent}%)`}
                            labelLine
                          >
                            {pieData.map((_, index) => (
                              <Cell key={index} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => typeof value === "number" ? value.toLocaleString() : value} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="grid grid-cols-2 gap-2 w-full mt-4">
                      {pieData.map((entry, index) => (
                        <div key={entry.name} className="flex items-center gap-2 text-xs">
                          <div className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                          <span className="text-muted-foreground">{entry.name}:</span>
                          <span className="font-medium">{entry.percent}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </StaggerItem>
          <StaggerItem className="min-w-0">
            <Card className="min-w-0 overflow-hidden">
              <CardHeader>
                <CardTitle className="text-base">Asset Portfolio Value</CardTitle>
              </CardHeader>
              <CardContent className="overflow-hidden">
                <div className="flex flex-col items-center w-full overflow-hidden">
                  <div className="w-full overflow-hidden">
                    <ResponsiveContainer width="100%" height={320}>
                      <BarChart margin={{ top: 10, right: 10, bottom: 10, left: 10 }} data={barData}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="name" className="text-xs" />
                        <YAxis className="text-xs" />
                        <Tooltip formatter={(value) => typeof value === "number" ? `Rs. ${value.toLocaleString()}` : value} />
                        <Bar dataKey="value" fill="url(#assetGradient)" radius={[4, 4, 0, 0]} />
                        <defs>
                          <linearGradient id="assetGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#06b6d4" />
                            <stop offset="100%" stopColor="#0891b2" />
                          </linearGradient>
                        </defs>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex items-center justify-center gap-8 w-full mt-4">
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">Assets Value</p>
                      <p className="text-lg font-bold">Rs. <PrivacyAmount><AnimatedCounter to={parseFloat(dashboard?.totalAssetValue ?? "0")} decimals={2} /></PrivacyAmount></p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">Shop Cash</p>
                      <p className="text-lg font-bold">Rs. <PrivacyAmount><AnimatedCounter to={parseFloat(dashboard?.totalShopCash ?? "0")} decimals={2} /></PrivacyAmount></p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </StaggerItem>
        </StaggerContainer>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">Shareholding Ledger</CardTitle>
            </div>
            <Link href="/business/members">
              <span className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 cursor-pointer">
                Manage Members <ArrowRight className="h-3 w-3" />
              </span>
            </Link>
          </CardHeader>
          <CardContent>
            {shareholdingRows.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No members with shares yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead className="text-right">Shares Owned</TableHead>
                      <TableHead className="text-right">Ownership %</TableHead>
                      <TableHead className="text-right">Equity Value</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {shareholdingRows.map((row) => (
                      <TableRow key={row.memberId}>
                        <TableCell className="font-medium">{row.memberName}</TableCell>
                        <TableCell className="text-right">{parseFloat(row.sharesOwned).toLocaleString()}</TableCell>
                        <TableCell className="text-right">{row.ownershipPercent}%</TableCell>
                        <TableCell className="text-right">
                          <PrivacyAmount>Rs. {(parseFloat(row.sharesOwned) * navPrice).toLocaleString()}</PrivacyAmount>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PageTransition>
  )
}
