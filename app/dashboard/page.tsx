"use client"

import { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { TicketStatusBadge } from "@/components/ticket-status-badge"
import { ClipboardList, Package, DollarSign, AlertTriangle, ArrowRight } from "lucide-react"
import { toast } from "sonner"
import { Skeleton } from "@/components/ui/skeleton"
import { PageTransition, StaggerContainer, StaggerItem, HoverCard } from "@/components/page-transition"
import { AnimatedCounter } from "@/components/animated-counter"

interface Ticket {
  id: string
  customerName: string | null
  brand: string
  model: string
  status: string
  paymentStatus: string
  createdAt: string
}

interface InventoryItem {
  id: number
  partName: string
  sku: string
  stockQty: number
  lowStockThreshold: number | null
  costPrice: string | null
  sellingPrice: string | null
}

interface Account {
  id: number
  name: string
  type: string
  balance: string
}

interface Expense {
  id: number
  amount: string
  date: string
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

export default function DashboardOverview() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch("/api/tickets").then((r) => r.ok ? r.json() : { tickets: [] }),
      fetch("/api/inventory").then((r) => r.ok ? r.json() : { items: [] }),
      fetch("/api/accounts").then((r) => r.ok ? r.json() : { accounts: [] }),
      fetch("/api/expenses").then((r) => r.ok ? r.json() : { expenses: [] }),
    ]).then(([t, i, a, e]) => {
      setTickets(t.tickets ?? [])
      setInventory(i.items ?? [])
      setAccounts(a.accounts ?? [])
      setExpenses(e.expenses ?? [])
    }).catch((error) => {
      toast.error(error.message || "Failed to load dashboard data")
    }).finally(() => setLoading(false))
  }, [])

  const stats = useMemo(() => {
    const active = tickets.filter((t) => t.status !== "completed" && t.status !== "cancelled").length
    const ready = tickets.filter((t) => t.status === "ready_for_pickup").length
    const repairing = tickets.filter((t) => t.status === "repairing").length
    const awaitingParts = tickets.filter((t) => t.status === "awaiting_parts").length
    const totalStock = inventory.reduce((s, i) => s + i.stockQty, 0)
    const uniqueParts = inventory.length
    const lowStock = inventory.filter((i) => {
      const threshold = i.lowStockThreshold ?? 0
      return i.stockQty <= threshold && i.stockQty > 0
    }).length
    const outOfStock = inventory.filter((i) => i.stockQty === 0).length

    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const monthExpenses = expenses
      .filter((e) => new Date(e.date) >= monthStart)
      .reduce((s, e) => s + parseFloat(e.amount), 0)

    const totalBalance = accounts.reduce((s, a) => s + parseFloat(a.balance), 0)

    return { active, ready, repairing, awaitingParts, totalStock, uniqueParts, lowStock, outOfStock, monthExpenses, totalBalance }
  }, [tickets, inventory, accounts, expenses])

  const recentTickets = useMemo(() => {
    return tickets.slice(0, 5)
  }, [tickets])

  const lowStockItems = useMemo(() => {
    return inventory
      .filter((i) => {
        const threshold = i.lowStockThreshold ?? 0
        return i.stockQty <= threshold
      })
      .sort((a, b) => a.stockQty - b.stockQty)
      .slice(0, 5)
  }, [inventory])

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
          <p className="text-muted-foreground">Welcome back! Here is what is happening today.</p>
        </div>

        <StaggerContainer className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StaggerItem>
            <HoverCard>
              <Card className="bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/60 dark:to-background border-blue-100 dark:border-blue-900/50">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Active Tickets</CardTitle>
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
                  <CardTitle className="text-sm font-medium">Parts in Stock</CardTitle>
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
                  <CardTitle className="text-sm font-medium">Available Balance</CardTitle>
                  <DollarSign className="h-4 w-4 text-violet-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    Rs. <AnimatedCounter to={stats.totalBalance} />
                  </div>
                  <p className="text-xs text-muted-foreground">Across {accounts.length} accounts</p>
                </CardContent>
              </Card>
            </HoverCard>
          </StaggerItem>
          <StaggerItem>
            <HoverCard>
              <Card className="bg-gradient-to-br from-rose-50 to-white dark:from-rose-950/60 dark:to-background border-rose-100 dark:border-rose-900/50">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Expenses This Month</CardTitle>
                  <DollarSign className="h-4 w-4 text-rose-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-destructive">
                    Rs. <AnimatedCounter to={stats.monthExpenses} />
                  </div>
                  <p className="text-xs text-muted-foreground">{stats.lowStock + stats.outOfStock} low stock alerts</p>
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
                  <AnimatedCounter to={tickets.length} />
                </p>
              </CardContent>
            </Card>
          </StaggerItem>
        </StaggerContainer>

        <StaggerContainer className="grid gap-4 lg:grid-cols-2">
          <StaggerItem>
            <HoverCard>
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
                            <p className="text-xs text-muted-foreground">{ticket.id} — {ticket.brand} {ticket.model}</p>
                          </div>
                          <TicketStatusBadge status={ticket.status} />
                        </Link>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </HoverCard>
          </StaggerItem>

          <StaggerItem>
            <HoverCard>
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
            </HoverCard>
          </StaggerItem>
        </StaggerContainer>
      </div>
    </PageTransition>
  )
}
