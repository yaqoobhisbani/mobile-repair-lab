"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DataTablePagination } from "@/components/data-table-pagination"
import { PageTransition, StaggerContainer, StaggerItem, HoverCard } from "@/components/page-transition"
import { AnimatedCounter } from "@/components/animated-counter"
import { PrivacyAmount } from "@/components/privacy-amount"
import { Plus, Search, X, Pencil, Trash2, Eye, Landmark, Wallet, Building2, Banknote, ArrowUp, ArrowLeftRight } from "lucide-react"
import { toast } from "sonner"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/empty-state"
import { useConfirm } from "@/hooks/use-confirm"
import { SlideOver } from "@/components/slide-over"
import { CreateAccountForm } from "@/components/forms/create-account-form"
import { EditAccountForm } from "@/components/forms/edit-account-form"
import { useAccounts } from "@/hooks/queries/use-accounts"
import { useDeleteAccount } from "@/hooks/mutations/use-delete-account"
import { useTopUpAccount } from "@/hooks/mutations/use-top-up-account"
import { useTransferAccount } from "@/hooks/mutations/use-transfer-account"

interface Account {
  id: number
  name: string
  type: "bank" | "cash"
  balance: string
  description: string | null
  createdAt: string
}

const typeLabels: Record<string, string> = {
  bank: "Bank Account",
  cash: "Cash",
}

export default function AccountsPage() {
  const { confirm, dialog } = useConfirm()
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [slideOverOpen, setSlideOverOpen] = useState(false)
  const [editAccountId, setEditAccountId] = useState<number | null>(null)
  const [pageSize, setPageSize] = useState(10)
  const [topUpOpen, setTopUpOpen] = useState(false)
  const [topUpAccountId, setTopUpAccountId] = useState<number | null>(null)
  const [topUpAmount, setTopUpAmount] = useState("")
  const [topUpDescription, setTopUpDescription] = useState("")
  const [transferOpen, setTransferOpen] = useState(false)
  const [transferSourceId, setTransferSourceId] = useState<number | null>(null)
  const [transferDestId, setTransferDestId] = useState<number | null>(null)
  const [transferAmount, setTransferAmount] = useState("")
  const [transferDescription, setTransferDescription] = useState("")

  const { data: accounts = [], isLoading } = useAccounts()
  const deleteAccountMutation = useDeleteAccount()
  const topUpMutation = useTopUpAccount()
  const transferMutation = useTransferAccount()

  function openCreateSlide() { setEditAccountId(null); setSlideOverOpen(true) }
  function openEditSlide(id: number) { setEditAccountId(id); setSlideOverOpen(true) }
  function closeSlide() { setSlideOverOpen(false); setEditAccountId(null) }

  const stats = useMemo(() => {
    const totalBalance = accounts.reduce((s, a) => s + parseFloat(a.balance), 0)
    const bankBalance = accounts.filter((a) => a.type === "bank").reduce((s, a) => s + parseFloat(a.balance), 0)
    const cashBalance = accounts.filter((a) => a.type === "cash").reduce((s, a) => s + parseFloat(a.balance), 0)
    return { totalAccounts: accounts.length, totalBalance, bankBalance, cashBalance }
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

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const safePage = Math.min(page, totalPages)
  const paginated = filtered.slice((safePage - 1) * pageSize, safePage * pageSize)

  const deleteAccount = async (id: number, name: string) => {
    const ok = await confirm({ title: "Delete account", description: `Delete "${name}"? This cannot be undone.`, variant: "destructive" }); if (!ok) return
    deleteAccountMutation.mutate(id, {
      onSuccess: () => toast.success("Account deleted successfully"),
      onError: () => toast.error("Failed to delete account"),
    })
  }

  const openTopUp = (id: number) => { setTopUpAccountId(id); setTopUpAmount(""); setTopUpDescription(""); setTopUpOpen(true) }

  const openTransfer = (sourceId: number) => {
    setTransferSourceId(sourceId)
    setTransferDestId(null)
    setTransferAmount("")
    setTransferDescription("")
    setTransferOpen(true)
  }

  const handleTransfer = () => {
    const amount = parseFloat(transferAmount)
    if (!amount || amount <= 0) { toast.error("Enter a valid amount"); return }
    if (!transferSourceId || !transferDestId) { toast.error("Select destination account"); return }
    if (transferSourceId === transferDestId) { toast.error("Cannot transfer to the same account"); return }
    const sourceBalance = accounts.find((a) => a.id === transferSourceId)?.balance
    if (sourceBalance && parseFloat(sourceBalance) < amount) { toast.error("Insufficient balance"); return }
    transferMutation.mutate(
      { sourceId: transferSourceId, toAccountId: transferDestId, amount, description: transferDescription || undefined },
      {
        onSuccess: () => {
          toast.success("Transfer completed successfully")
          setTransferOpen(false)
        },
        onError: (err) => {
          toast.error(err instanceof Error ? err.message : "Transfer failed")
        },
      }
    )
  }

  const handleTopUp = () => {
    const amount = parseFloat(topUpAmount)
    if (!amount || amount <= 0) { toast.error("Enter a valid amount"); return }
    if (!topUpAccountId) return
    topUpMutation.mutate(
      { id: topUpAccountId, amount, description: topUpDescription || undefined },
      {
        onSuccess: () => {
          toast.success("Account topped up successfully")
          setTopUpOpen(false)
        },
        onError: (err) => {
          toast.error(err instanceof Error ? err.message : "Failed to top up")
        },
      }
    )
  }

  return (
    <PageTransition>
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-emerald-500 to-cyan-500 bg-clip-text text-transparent">Accounts</h1>
          <p className="text-sm text-muted-foreground">Manage payment receivable accounts.</p>
        </div>
        <Button onClick={openCreateSlide}>
          <Plus className="h-4 w-4 mr-2" />
          New Account
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : (
          <StaggerContainer className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StaggerItem>
              <HoverCard>
                <Card className="bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/60 dark:to-background border-blue-100 dark:border-blue-900/50">
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
                <Card className="bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-950/60 dark:to-background border-emerald-100 dark:border-emerald-900/50">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Total Balance</CardTitle>
                    <Wallet className="h-4 w-4 text-emerald-500" />
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-emerald-600">Rs. <PrivacyAmount><AnimatedCounter to={stats.totalBalance} decimals={0} /></PrivacyAmount></p>
                  </CardContent>
                </Card>
              </HoverCard>
            </StaggerItem>
            <StaggerItem>
              <HoverCard>
                <Card className="bg-gradient-to-br from-violet-50 to-white dark:from-violet-950/60 dark:to-background border-violet-100 dark:border-violet-900/50">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Bank Balance</CardTitle>
                    <Building2 className="h-4 w-4 text-violet-500" />
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-violet-600">Rs. <PrivacyAmount><AnimatedCounter to={stats.bankBalance} decimals={0} /></PrivacyAmount></p>
                  </CardContent>
                </Card>
              </HoverCard>
            </StaggerItem>
            <StaggerItem>
              <HoverCard>
                <Card className="bg-gradient-to-br from-amber-50 to-white dark:from-amber-950/60 dark:to-background border-amber-100 dark:border-amber-900/50">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Cash Balance</CardTitle>
                    <Banknote className="h-4 w-4 text-amber-500" />
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-amber-600">Rs. <PrivacyAmount><AnimatedCounter to={stats.cashBalance} decimals={0} /></PrivacyAmount></p>
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
          {isLoading ? (
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
                  <Button onClick={openCreateSlide}>
                    <Plus className="h-4 w-4 mr-2" />
                    New Account
                  </Button>
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
              <div className="overflow-x-auto">
                <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginated.map((account) => (
                    <TableRow key={account.id}>
                      <TableCell className="font-medium">{account.name}</TableCell>
                      <TableCell>{typeLabels[account.type] || account.type}</TableCell>
                      <TableCell className="text-muted-foreground">{account.description || "—"}</TableCell>
                      <TableCell className="text-right font-medium">Rs. <PrivacyAmount>{parseFloat(account.balance).toLocaleString()}</PrivacyAmount></TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-0.5 sm:gap-1 flex-wrap">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 sm:h-8 sm:w-8 text-emerald-600 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950"
                            onClick={() => openTopUp(account.id)}
                            title="Top Up"
                          >
                            <ArrowUp className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 sm:h-8 sm:w-8 text-blue-600 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950"
                            onClick={() => openTransfer(account.id)}
                            title="Transfer"
                          >
                            <ArrowLeftRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          </Button>
                          <Link href={`/dashboard/finance/accounts/${account.id}`}>
                            <Button variant="ghost" size="icon" className="h-7 w-7 sm:h-8 sm:w-8" title="View">
                              <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 sm:h-8 sm:w-8"
                            onClick={() => openEditSlide(account.id)}
                            title="Edit"
                          >
                            <Pencil className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 sm:h-8 sm:w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => deleteAccount(account.id, account.name)}
                            title="Delete"
                          >
                            <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          </Button>
                        </div>
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
        onOpenChange={(open) => { if (!open) closeSlide() }}
        title={editAccountId ? "Edit Account" : "New Account"}
        description={editAccountId ? "Update account information." : "Create a new payment receivable account."}
        gradient="accounts"
      >
        {editAccountId ? (
          <EditAccountForm accountId={editAccountId} onSuccess={() => { closeSlide() }} onCancel={closeSlide} />
        ) : (
          <CreateAccountForm onSuccess={() => { closeSlide() }} onCancel={closeSlide} />
        )}
      </SlideOver>

      <SlideOver
        open={topUpOpen}
        onOpenChange={setTopUpOpen}
        title="Top Up Account"
        description="Add funds to this account. A credit transaction will be recorded."
        gradient="accounts"
      >
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1 block">Amount (Rs.)</label>
            <Input
              type="number"
              min="0"
              step="0.01"
              placeholder="Enter amount"
              value={topUpAmount}
              onChange={(e) => setTopUpAmount(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Description (optional)</label>
            <Input
              placeholder="e.g. Cash deposit"
              value={topUpDescription}
              onChange={(e) => setTopUpDescription(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 pt-2">
            <Button variant="outline" onClick={() => setTopUpOpen(false)} disabled={topUpMutation.isPending} className="flex-1">Cancel</Button>
            <Button onClick={handleTopUp} disabled={topUpMutation.isPending} className="flex-1">
              {topUpMutation.isPending ? "Topping up..." : "Top Up"}
            </Button>
          </div>
        </div>
      </SlideOver>

      <SlideOver
        open={transferOpen}
        onOpenChange={setTransferOpen}
        title="Transfer Funds"
        description="Move funds between accounts. A debit and credit transaction will be recorded."
        gradient="accounts"
      >
        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium mb-1 block">From</Label>
            <p className="text-sm font-medium px-3 py-2 rounded-md border bg-muted/50">
              {accounts.find((a) => a.id === transferSourceId)?.name ?? "—"}
            </p>
          </div>
          <div>
            <Label className="text-sm font-medium mb-1 block">To</Label>
            <Select
              value={transferDestId ? String(transferDestId) : ""}
              onValueChange={(v) => setTransferDestId(Number(v))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select destination account" />
              </SelectTrigger>
              <SelectContent>
                {accounts
                  .filter((a) => a.id !== transferSourceId)
                  .map((a) => (
                    <SelectItem key={a.id} value={String(a.id)}>
                      {a.name} (Rs. {parseFloat(a.balance).toLocaleString()})
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-sm font-medium mb-1 block">Amount (Rs.)</Label>
            <Input
              type="number"
              min="0"
              step="0.01"
              placeholder="Enter amount"
              value={transferAmount}
              onChange={(e) => setTransferAmount(e.target.value)}
            />
          </div>
          <div>
            <Label className="text-sm font-medium mb-1 block">Description (optional)</Label>
            <Input
              placeholder="e.g. Transfer to savings"
              value={transferDescription}
              onChange={(e) => setTransferDescription(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 pt-2">
            <Button variant="outline" onClick={() => setTransferOpen(false)} disabled={transferMutation.isPending} className="flex-1">Cancel</Button>
            <Button onClick={handleTransfer} disabled={transferMutation.isPending} className="flex-1">
              {transferMutation.isPending ? "Transferring..." : "Transfer"}
            </Button>
          </div>
        </div>
      </SlideOver>
    </PageTransition>
  )
}
