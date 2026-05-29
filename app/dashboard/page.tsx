"use client"

import { useMemo } from "react"
import { PrivacyAmount } from "@/components/privacy-amount"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { TicketStatusBadge } from "@/components/ticket-status-badge"
import { ClipboardList, Package, DollarSign, AlertTriangle, ArrowRight } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { PageTransition, StaggerContainer, StaggerItem, HoverCard } from "@/components/page-transition"
import { AnimatedCounter } from "@/components/animated-counter"
import { capitalize } from "@/lib/utils"
import { useTickets } from "@/hooks/queries/use-tickets"
import { useInventory } from "@/hooks/queries/use-inventory"
import { useAccounts } from "@/hooks/queries/use-accounts"
import { useExpenses } from "@/hooks/queries/use-expenses"

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

export default function DashboardOverview() {
  const { data: tickets, isLoading: ticketsLoading } = useTickets()
  const { data: inventory, isLoading: inventoryLoading } = useInventory()
  const { data: accounts, isLoading: accountsLoading } = useAccounts()
  const { data: expenses, isLoading: expensesLoading } = useExpenses()

  const loading = ticketsLoading || inventoryLoading || accountsLoading || expensesLoading

  const stats = useMemo(() => {
    const t = tickets ?? []
    const i = inventory ?? []
    const a = accounts ?? []
    const e = expenses ?? []

    const active = t.filter((t) => t.status !== "completed" && t.status !== "cancelled").length
    const ready = t.filter((t) => t.status === "ready_for_pickup").length
    const repairing = t.filter((t) => t.status === "repairing").length
    const awaitingParts = t.filter((t) => t.status === "awaiting_parts").length
    const totalStock = i.reduce((s, item) => s + item.stockQty, 0)
    const uniqueParts = i.length
    const lowStock = i.filter((item) => {
      const threshold = item.lowStockThreshold ?? 0
      return item.stockQty <= threshold && item.stockQty > 0
    }).length
    const outOfStock = i.filter((item) => item.stockQty === 0).length

    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const monthExpensesTotal = e
      .filter((ex) => new Date(ex.date) >= monthStart)
      .reduce((s, ex) => s + parseFloat(ex.amount), 0)
    const monthExpenseCount = e.filter((ex) => new Date(ex.date) >= monthStart).length

    const totalBalance = a.reduce((s, ac) => s + parseFloat(ac.balance), 0)

    return { active, ready, repairing, awaitingParts, totalStock, uniqueParts, lowStock, outOfStock, monthExpenses: monthExpensesTotal, monthExpenseCount, totalBalance, totalTickets: t.length }
  }, [tickets, inventory, accounts, expenses])

  const recentTickets = (tickets ?? []).slice(0, 5)

  const lowStockItems = (inventory ?? [])
    .filter((i) => {
      const threshold = i.lowStockThreshold ?? 0
      return i.stockQty <= threshold
    })
    .sort((a, b) => a.stockQty - b.stockQty)
    .slice(0, 5)

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="space-y-1">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-24 w-full rounded-xl" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-24 w-full rounded-xl" />
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
        </div>
      </div>
    )
  }

  return (
    <PageTransition>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Overview</h1>
          <p className="text-sm text-muted-foreground">Welcome back! Here is what is happening today.</p>
        </div>

        <StaggerContainer className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StaggerItem>
            <HoverCard>
              <Card className="bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/60 dark:to-background border-blue-100 dark:border-blue-900/50">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active Tickets</CardTitle>
                  <ClipboardList className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    <AnimatedCounter to={stats.active} />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {stats.repairing > 0 || stats.awaitingParts > 0
                      ? `${stats.repairing} in repair, ${stats.awaitingParts} awaiting parts`
                      : stats.ready > 0
                        ? `${stats.ready} ready for pickup`
                        : "No active tickets"}
                  </p>
                </CardContent>
              </Card>
            </HoverCard>
          </StaggerItem>
          <StaggerItem>
            <HoverCard>
              <Card className="bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-950/60 dark:to-background border-emerald-100 dark:border-emerald-900/50">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Parts in Stock</CardTitle>
                  <Package className="h-4 w-4 text-emerald-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    <AnimatedCounter to={stats.totalStock} />
                  </div>
                  <p className="text-xs text-muted-foreground">Across {stats.uniqueParts} unique parts</p>
                </CardContent>
              </Card>
            </HoverCard>
          </StaggerItem>
          <StaggerItem>
            <HoverCard>
              <Card className="bg-gradient-to-br from-violet-50 to-white dark:from-violet-950/60 dark:to-background border-violet-100 dark:border-violet-900/50">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Available Balance</CardTitle>
                  <DollarSign className="h-4 w-4 text-violet-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    Rs. <PrivacyAmount><AnimatedCounter to={stats.totalBalance} /></PrivacyAmount>
                  </div>
                  <p className="text-xs text-muted-foreground">Across {accounts?.length ?? 0} accounts</p>
                </CardContent>
              </Card>
            </HoverCard>
          </StaggerItem>
          <StaggerItem>
            <HoverCard>
              <Card className="bg-gradient-to-br from-rose-50 to-white dark:from-rose-950/60 dark:to-background border-rose-100 dark:border-rose-900/50">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Expenses This Month</CardTitle>
                  <DollarSign className="h-4 w-4 text-rose-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-destructive">
                    Rs. <PrivacyAmount><AnimatedCounter to={stats.monthExpenses} /></PrivacyAmount>
                  </div>
                  <p className="text-xs text-muted-foreground">{stats.monthExpenseCount} expense entries this month</p>
                </CardContent>
              </Card>
            </HoverCard>
          </StaggerItem>
        </StaggerContainer>

        <StaggerContainer className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StaggerItem>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Low Stock</CardTitle>
              </CardHeader>
              <CardContent>
                <p className={`text-2xl font-bold ${stats.lowStock > 0 ? "text-amber-500" : ""}`}>
                  <AnimatedCounter to={stats.lowStock} />
                </p>
              </CardContent>
            </Card>
          </StaggerItem>
          <StaggerItem>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Out of Stock</CardTitle>
              </CardHeader>
              <CardContent>
                <p className={`text-2xl font-bold ${stats.outOfStock > 0 ? "text-destructive" : ""}`}>
                  <AnimatedCounter to={stats.outOfStock} />
                </p>
              </CardContent>
            </Card>
          </StaggerItem>
          <StaggerItem>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Ready for Pickup</CardTitle>
              </CardHeader>
              <CardContent>
                <p className={`text-2xl font-bold ${stats.ready > 0 ? "text-emerald-600" : ""}`}>
                  <AnimatedCounter to={stats.ready} />
                </p>
              </CardContent>
            </Card>
          </StaggerItem>
          <StaggerItem>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Tickets</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  <AnimatedCounter to={stats.totalTickets} />
                </p>
              </CardContent>
            </Card>
          </StaggerItem>
        </StaggerContainer>

        <StaggerContainer className="grid gap-4 lg:grid-cols-2">
          <StaggerItem>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Recent Tickets</CardTitle>
                </div>
                <Link href="/dashboard/tickets">
                  <Button variant="ghost" size="sm">
                    View All <ArrowRight className="h-3 w-3 ml-1" />
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentTickets.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4 text-center">No tickets yet.</p>
                  ) : (
                    recentTickets.map((ticket) => (
                      <Link key={ticket.id} href={`/dashboard/tickets/${ticket.id}`} className="flex items-center justify-between group">
                        <div>
                          <p className="text-sm font-medium group-hover:underline">{ticket.customerName ?? "Unknown"}</p>
                          <p className="text-xs text-muted-foreground">{ticket.id} — {capitalize(ticket.brand)} {ticket.model}</p>
                        </div>
                        <TicketStatusBadge status={ticket.status} />
                      </Link>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </StaggerItem>

          <StaggerItem>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Low Stock Items</CardTitle>
                </div>
                <Link href="/dashboard/inventory">
                  <Button variant="ghost" size="sm">
                    View All <ArrowRight className="h-3 w-3 ml-1" />
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                  <div className="space-y-4">
                    {lowStockItems.length === 0 ? (
                      <p className="text-sm text-muted-foreground py-4 text-center">All items are well stocked.</p>
                    ) : (
                      lowStockItems.map((item) => (
                        <Link key={item.id} href={`/dashboard/inventory/${item.id}`} className="flex items-center justify-between group">
                          <div>
                            <p className="text-sm font-medium group-hover:underline">{item.partName}</p>
                            <p className="text-xs text-muted-foreground">SKU: {item.sku}</p>
                          </div>
                          <span className={`text-xs font-medium ${item.stockQty === 0 ? "text-destructive" : "text-amber-500"}`}>
                            {item.stockQty === 0 ? "Out of Stock" : `${item.stockQty} left`}
                          </span>
                        </Link>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
          </StaggerItem>
        </StaggerContainer>
      </div>
    </PageTransition>
  )
}
