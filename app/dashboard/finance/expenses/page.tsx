"use client"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DataTablePagination } from "@/components/data-table-pagination"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Search, X, Trash2, Wallet, CalendarDays, CalendarRange, Clock, List } from "lucide-react"
import { toast } from "sonner"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/empty-state"
import { PageTransition, StaggerContainer, StaggerItem, HoverCard } from "@/components/page-transition"
import { AnimatedCounter } from "@/components/animated-counter"
import { useConfirm } from "@/hooks/use-confirm"
import { SlideOver } from "@/components/slide-over"
import { CreateExpenseForm } from "@/components/forms/create-expense-form"
import { DatePicker } from "@/components/date-picker"
import { MonthPicker } from "@/components/month-picker"
import { startOfMonth, endOfMonth, startOfYear, endOfYear, isWithinInterval, parseISO } from "date-fns"

interface Expense {
  id: number
  description: string
  amount: string
  category: string | null
  accountId: number
  accountName: string | null
  date: string
  createdAt: string
}

export default function ExpensesPage() {
  const { confirm, dialog } = useConfirm()

  function formatDate(d: string) {
    return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
  }

  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [slideOverOpen, setSlideOverOpen] = useState(false)
  const [datePeriod, setDatePeriod] = useState("monthly")
  const [referenceDate, setReferenceDate] = useState<Date>(new Date())

  useEffect(() => {
    fetch("/api/expenses")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch")
        return res.json()
      })
      .then((data) => setExpenses(data.expenses ?? []))
      .catch(() => toast.error("Failed to load expenses"))
      .finally(() => setLoading(false))
  }, [])

  const categories = useMemo(() => {
    const set = new Set<string>()
    expenses.forEach((e) => { if (e.category) set.add(e.category) })
    return Array.from(set).sort()
  }, [expenses])

  const stats = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)

    const todayTotal = expenses
      .filter((e) => new Date(e.date) >= today)
      .reduce((s, e) => s + parseFloat(e.amount), 0)
    const monthTotal = expenses
      .filter((e) => new Date(e.date) >= monthStart)
      .reduce((s, e) => s + parseFloat(e.amount), 0)
    const allTime = expenses.reduce((s, e) => s + parseFloat(e.amount), 0)
    const count = expenses.length

    return { todayTotal, monthTotal, allTime, count }
  }, [expenses])

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

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return expenses.filter((e) => {
      const expenseDate = parseISO(e.date)
      if (datePeriod !== "all") {
        const range = getDateRange
        if (!isWithinInterval(expenseDate, { start: range.start, end: range.end })) return false
      }
      const matchesSearch =
        !q ||
        e.description.toLowerCase().includes(q) ||
        (e.category ?? "").toLowerCase().includes(q) ||
        (e.accountName ?? "").toLowerCase().includes(q)
      const matchesCategory = categoryFilter === "all" || e.category === categoryFilter
      return matchesSearch && matchesCategory
    })
  }, [expenses, search, categoryFilter, datePeriod, getDateRange])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const safePage = Math.min(page, totalPages)
  const paginated = filtered.slice((safePage - 1) * pageSize, safePage * pageSize)

  const hasFilters = search || categoryFilter !== "all" || datePeriod !== "all"

  const clearFilters = () => {
    setSearch("")
    setCategoryFilter("all")
    setDatePeriod("monthly")
    setReferenceDate(new Date())
    setPage(1)
  }

  const deleteExpense = async (id: number, description: string) => {
    const ok = await confirm({ title: "Delete expense", description: `Delete expense "${description}"? Amount will be restored to the account.`, variant: "destructive" }); if (!ok) return
    try {
      const res = await fetch(`/api/expenses/${id}`, { method: "DELETE" })
      if (res.ok) {
        setExpenses((prev) => prev.filter((e) => e.id !== id))
        toast.success("Expense deleted successfully")
      }
    } catch {}
  }

  return (
    <PageTransition><div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-rose-600 to-red-600 bg-clip-text text-transparent">Expenses</h1>
          <p className="text-sm text-muted-foreground">Track all business expenses.</p>
        </div>
        <Button onClick={() => setSlideOverOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Expense
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {loading ? (
          <>
            <Card>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-16" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-24" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-20" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-24" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-16" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-24" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-20" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-24" />
              </CardContent>
            </Card>
          </>
        ) : (
          <StaggerContainer className="contents">
            <StaggerItem>
              <HoverCard>
                <Card className="bg-gradient-to-br from-rose-50 to-white dark:from-rose-950/60 dark:to-background border-rose-100 dark:border-rose-900/50">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Today</CardTitle>
                    <CalendarDays className="h-4 w-4 text-rose-500" />
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-rose-600">Rs. <AnimatedCounter to={stats.todayTotal} /></p>
                  </CardContent>
                </Card>
              </HoverCard>
            </StaggerItem>
            <StaggerItem>
              <HoverCard>
                <Card className="bg-gradient-to-br from-orange-50 to-white dark:from-orange-950/60 dark:to-background border-orange-100 dark:border-orange-900/50">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">This Month</CardTitle>
                    <CalendarRange className="h-4 w-4 text-orange-500" />
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-orange-600">Rs. <AnimatedCounter to={stats.monthTotal} /></p>
                  </CardContent>
                </Card>
              </HoverCard>
            </StaggerItem>
            <StaggerItem>
              <HoverCard>
                <Card className="bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/60 dark:to-background border-blue-100 dark:border-blue-900/50">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">All Time</CardTitle>
                    <Clock className="h-4 w-4 text-blue-500" />
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-blue-600">Rs. <AnimatedCounter to={stats.allTime} /></p>
                  </CardContent>
                </Card>
              </HoverCard>
            </StaggerItem>
            <StaggerItem>
              <HoverCard>
                <Card className="bg-gradient-to-br from-violet-50 to-white dark:from-violet-950/60 dark:to-background border-violet-100 dark:border-violet-900/50">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Total Entries</CardTitle>
                    <List className="h-4 w-4 text-violet-500" />
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold"><AnimatedCounter to={stats.count} /></p>
                  </CardContent>
                </Card>
              </HoverCard>
            </StaggerItem>
          </StaggerContainer>
        )}
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by description, category, or account..."
                className="pl-9"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              />
            </div>
            <div className="flex items-center gap-2">
              <Select value={datePeriod} onValueChange={(v) => { setDatePeriod(v); setReferenceDate(new Date()); setPage(1) }}>
                <SelectTrigger className="w-32">
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
                <DatePicker
                  value={referenceDate}
                  onChange={(d) => { if (d) setReferenceDate(d) }}
                  className="h-9 w-40"
                />
              )}
              {datePeriod === "monthly" && (
                <MonthPicker
                  value={referenceDate}
                  onChange={(d) => setReferenceDate(d)}
                  className="h-9 w-40"
                />
              )}
              {datePeriod === "yearly" && (
                <select
                  value={referenceDate.getFullYear()}
                  onChange={(e) => setReferenceDate(new Date(Number(e.target.value), 0, 1))}
                  className="h-9 text-sm rounded-md border border-input bg-transparent px-3 w-28"
                >
                  {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 5 + i).map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              )}
            </div>
            <Select value={categoryFilter} onValueChange={(v) => { setCategoryFilter(v); setPage(1) }}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {hasFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="shrink-0">
                <X className="h-4 w-4 mr-1" />
                Clear
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={Wallet}
              title={expenses.length === 0 ? "No expenses yet" : "No expenses found"}
              description={expenses.length === 0 ? "Log your first expense!" : "No expenses match your search or filters."}
                action={
                  expenses.length === 0 ? (
                    <Button onClick={() => setSlideOverOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      New Expense
                    </Button>
                  ) : undefined
                }
            />
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Account</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginated.map((expense) => (
                    <TableRow key={expense.id}>
                      <TableCell className="text-muted-foreground">{formatDate(expense.date)}</TableCell>
                      <TableCell className="font-medium">{expense.description}</TableCell>
                      <TableCell>
                        {expense.category ? (
                          <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
                            {expense.category}
                          </span>
                        ) : "—"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{expense.accountName || "—"}</TableCell>
                      <TableCell className="text-right font-medium text-destructive">
                        - Rs. {parseFloat(expense.amount).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => deleteExpense(expense.id, expense.description)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table></div>
              <DataTablePagination
                currentPage={safePage}
                totalPages={totalPages}
                totalItems={filtered.length}
                pageSize={pageSize}
                onPageChange={setPage}
                onPageSizeChange={setPageSize}
              />
            </>
          )}
        </CardContent>
      </Card>
    </div>
      {dialog}

      <SlideOver
        open={slideOverOpen}
        onOpenChange={setSlideOverOpen}
        title="New Expense"
        description="Log a business expense."
        gradient="expenses"
      >
        <CreateExpenseForm onSuccess={() => { setSlideOverOpen(false); fetch("/api/expenses").then(r => r.json()).then(d => setExpenses(d.expenses ?? [])).catch(() => toast.error("Failed to refresh expenses")) }} onCancel={() => setSlideOverOpen(false)} />
      </SlideOver>
    </PageTransition>
  )
}
