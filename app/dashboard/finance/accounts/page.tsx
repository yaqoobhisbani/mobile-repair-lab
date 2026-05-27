"use client"

import { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DataTablePagination } from "@/components/data-table-pagination"
import { PageTransition, StaggerContainer, StaggerItem, HoverCard } from "@/components/page-transition"
import { AnimatedCounter } from "@/components/animated-counter"
import { Plus, Search, X, Pencil, Trash2, Landmark, Wallet, Building2, Banknote } from "lucide-react"
import { toast } from "sonner"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/empty-state"

interface Account {
  id: number
  name: string
  type: "bank" | "cash" | "wallet"
  balance: string
  description: string | null
  createdAt: string
}

const ITEMS_PER_PAGE = 10

const typeLabels: Record<string, string> = {
  bank: "Bank Account",
  cash: "Cash",
  wallet: "Mobile Wallet",
}

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)

  useEffect(() => {
    fetch("/api/accounts")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch")
        return res.json()
      })
      .then((data) => setAccounts(data.accounts ?? []))
      .catch(() => toast.error("Failed to load accounts"))
      .finally(() => setLoading(false))
  }, [])

  const stats = useMemo(() => {
    const totalBalance = accounts.reduce((s, a) => s + parseFloat(a.balance), 0)
    const bankCount = accounts.filter((a) => a.type === "bank").length
    const cashCount = accounts.filter((a) => a.type === "cash").length
    const walletCount = accounts.filter((a) => a.type === "wallet").length
    return { totalAccounts: accounts.length, totalBalance, bankCount, cashCount, walletCount }
  }, [accounts])

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    if (!q) return accounts
    return accounts.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        a.type.toLowerCase().includes(q) ||
        (a.description ?? "").toLowerCase().includes(q)
    )
  }, [accounts, search])

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE))
  const safePage = Math.min(page, totalPages)
  const paginated = filtered.slice((safePage - 1) * ITEMS_PER_PAGE, safePage * ITEMS_PER_PAGE)

  const deleteAccount = async (id: number, name: string) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return
    try {
      const res = await fetch(`/api/accounts/${id}`, { method: "DELETE" })
      if (res.ok) {
        setAccounts((prev) => prev.filter((a) => a.id !== id))
        toast.success("Account deleted successfully")
      }
    } catch {}
  }

  return (
    <PageTransition>
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-emerald-500 to-cyan-500 bg-clip-text text-transparent">Accounts</h1>
          <p className="text-muted-foreground">Manage payment receivable accounts.</p>
        </div>
        <Link href="/dashboard/finance/accounts/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Account
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : (
          <StaggerContainer className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <StaggerItem>
              <HoverCard>
                <Card className="bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/30 dark:to-background border-blue-100 dark:border-blue-900/50">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Total Accounts</CardTitle>
                    <Landmark className="h-4 w-4 text-blue-500" />
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">
                      <AnimatedCounter to={stats.totalAccounts} />
                    </p>
                  </CardContent>
                </Card>
              </HoverCard>
            </StaggerItem>
            <StaggerItem>
              <HoverCard>
                <Card className="bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-950/30 dark:to-background border-emerald-100 dark:border-emerald-900/50">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Total Balance</CardTitle>
                    <Wallet className="h-4 w-4 text-emerald-500" />
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-emerald-600">Rs. <AnimatedCounter to={stats.totalBalance} decimals={0} /></p>
                  </CardContent>
                </Card>
              </HoverCard>
            </StaggerItem>
            <StaggerItem>
              <HoverCard>
                <Card className="bg-gradient-to-br from-violet-50 to-white dark:from-violet-950/30 dark:to-background border-violet-100 dark:border-violet-900/50">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Bank Accounts</CardTitle>
                    <Building2 className="h-4 w-4 text-violet-500" />
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-violet-600">
                      <AnimatedCounter to={stats.bankCount} />
                    </p>
                  </CardContent>
                </Card>
              </HoverCard>
            </StaggerItem>
            <StaggerItem>
              <HoverCard>
                <Card className="bg-gradient-to-br from-amber-50 to-white dark:from-amber-950/30 dark:to-background border-amber-100 dark:border-amber-900/50">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Cash</CardTitle>
                    <Banknote className="h-4 w-4 text-amber-500" />
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-amber-600">
                      <AnimatedCounter to={stats.cashCount} />
                    </p>
                  </CardContent>
                </Card>
              </HoverCard>
            </StaggerItem>
            <StaggerItem>
              <HoverCard>
                <Card className="bg-gradient-to-br from-cyan-50 to-white dark:from-cyan-950/30 dark:to-background border-cyan-100 dark:border-cyan-900/50">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Mobile Wallets</CardTitle>
                    <Wallet className="h-4 w-4 text-cyan-500" />
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-cyan-600">
                      <AnimatedCounter to={stats.walletCount} />
                    </p>
                  </CardContent>
                </Card>
              </HoverCard>
            </StaggerItem>
          </StaggerContainer>
      )}

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name, type, or description..."
                className="pl-9"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              />
            </div>
            {search && (
              <Button variant="ghost" size="sm" onClick={() => { setSearch(""); setPage(1) }} className="shrink-0">
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
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : filtered.length === 0 ? (
            accounts.length === 0 ? (
              <EmptyState
                icon={Landmark}
                title="No accounts"
                description="No accounts yet. Create your first account!"
                action={
                  <Link href="/dashboard/finance/accounts/new">
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      New Account
                    </Button>
                  </Link>
                }
              />
            ) : (
              <EmptyState
                icon={Landmark}
                title="No accounts found"
                description="No accounts found matching your search."
              />
            )
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Balance</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginated.map((account) => (
                    <TableRow key={account.id}>
                      <TableCell className="font-medium">{account.name}</TableCell>
                      <TableCell>{typeLabels[account.type] || account.type}</TableCell>
                      <TableCell className={parseFloat(account.balance) >= 0 ? "" : "text-destructive"}>
                        Rs. {parseFloat(account.balance).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{account.description || "—"}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Link href={`/dashboard/finance/accounts/${account.id}`}>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => deleteAccount(account.id, account.name)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
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
    </PageTransition>
  )
}
