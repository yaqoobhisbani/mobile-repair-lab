"use client"

import { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DataTablePagination } from "@/components/data-table-pagination"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Search, X, Trash2, Wallet } from "lucide-react"
import { toast } from "sonner"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/empty-state"

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

const ITEMS_PER_PAGE = 10

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [page, setPage] = useState(1)

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

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return expenses.filter((e) => {
      const matchesSearch =
        !q ||
        e.description.toLowerCase().includes(q) ||
        (e.category ?? "").toLowerCase().includes(q) ||
        (e.accountName ?? "").toLowerCase().includes(q)
      const matchesCategory = categoryFilter === "all" || e.category === categoryFilter
      return matchesSearch && matchesCategory
    })
  }, [expenses, search, categoryFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE))
  const safePage = Math.min(page, totalPages)
  const paginated = filtered.slice((safePage - 1) * ITEMS_PER_PAGE, safePage * ITEMS_PER_PAGE)

  const hasFilters = search || categoryFilter !== "all"

  const clearFilters = () => {
    setSearch("")
    setCategoryFilter("all")
    setPage(1)
  }

  const deleteExpense = async (id: number, description: string) => {
    if (!confirm(`Delete expense "${description}"? Amount will be restored to the account.`)) return
    try {
      const res = await fetch(`/api/expenses/${id}`, { method: "DELETE" })
      if (res.ok) {
        setExpenses((prev) => prev.filter((e) => e.id !== id))
        toast.success("Expense deleted successfully")
      }
    } catch {}
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Expenses</h1>
          <p className="text-muted-foreground">Track all business expenses.</p>
        </div>
        <Link href="/dashboard/finance/expenses/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Expense
          </Button>
        </Link>
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
          <>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Today</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">Rs. {stats.todayTotal.toFixed(0)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">This Month</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">Rs. {stats.monthTotal.toFixed(0)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">All Time</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">Rs. {stats.allTime.toFixed(0)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Entries</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{stats.count}</p>
              </CardContent>
            </Card>
          </>
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
            <Select value={categoryFilter} onValueChange={(v) => { setCategoryFilter(v); setPage(1) }}>
              <SelectTrigger className="w-full sm:w-44">
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
                  <Link href="/dashboard/finance/expenses/new">
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      New Expense
                    </Button>
                  </Link>
                ) : undefined
              }
            />
          ) : (
            <>
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
              </Table>
              <DataTablePagination
                currentPage={safePage}
                totalPages={totalPages}
                totalItems={filtered.length}
                pageSize={ITEMS_PER_PAGE}
                onPageChange={setPage}
              />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
