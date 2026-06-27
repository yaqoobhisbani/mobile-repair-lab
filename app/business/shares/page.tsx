"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DataTablePagination } from "@/components/data-table-pagination"
import { Plus, ArrowLeftRight, Loader2, Banknote, Search, X } from "lucide-react"
import { PageTransition } from "@/components/page-transition"
import { AnimatedCounter } from "@/components/animated-counter"
import { PrivacyAmount } from "@/components/privacy-amount"
import { toast } from "sonner"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/empty-state"
import { SlideOver } from "@/components/slide-over"
import { useBusinessShares } from "@/hooks/queries/use-business-shares"
import { useBusinessMembers } from "@/hooks/queries/use-business-members"
import { useCreateShareTransaction } from "@/hooks/mutations/use-create-share-transaction"
import { useNavPrice } from "@/hooks/queries/use-nav-price"

function getTypeBadge(type: string) {
  const styles: Record<string, string> = {
    initial_issuance: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    internal_transfer: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    equity_withdrawal: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  }
  const labels: Record<string, string> = {
    initial_issuance: "Issuance",
    internal_transfer: "Transfer",
    equity_withdrawal: "Withdrawal",
  }
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${styles[type] ?? ""}`}>
      {labels[type] ?? type}
    </span>
  )
}

export default function SharesPage() {
  const { data: transactions = [], isLoading } = useBusinessShares()
  const { data: members = [] } = useBusinessMembers()
  const navPrice = useNavPrice()
  const createTransaction = useCreateShareTransaction()

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [issueDialogOpen, setIssueDialogOpen] = useState(false)
  const [transferDialogOpen, setTransferDialogOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")

  const [issueForm, setIssueForm] = useState({ memberId: "", cashAmount: "" })
  const [transferForm, setTransferForm] = useState({ sellerId: "", buyerId: "", sharesCount: "", pricePerShare: "", notes: "" })

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return transactions.filter((tx) => {
      const matchesSearch =
        !q ||
        (tx.sellerName ?? "").toLowerCase().includes(q) ||
        (tx.buyerName ?? "").toLowerCase().includes(q)
      const matchesType = typeFilter === "all" || tx.transactionType === typeFilter
      return matchesSearch && matchesType
    })
  }, [search, typeFilter, transactions])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const safePage = Math.min(page, totalPages)
  const paginated = filtered.slice((safePage - 1) * pageSize, safePage * pageSize)

  const hasFilters = search || typeFilter !== "all"

  const totalShares = useMemo(
    () => transactions.reduce((sum, t) => sum + parseFloat(t.sharesCount), 0),
    [transactions]
  )
  const totalValue = useMemo(
    () => transactions.reduce((sum, t) => sum + parseFloat(t.totalAmount), 0),
    [transactions]
  )

  const memberShareBalance = useMemo(() => {
    const balance: Record<number, number> = {}
    for (const tx of transactions) {
      if (tx.buyerMemberId) balance[tx.buyerMemberId] = (balance[tx.buyerMemberId] ?? 0) + parseFloat(tx.sharesCount)
      if (tx.sellerMemberId) balance[tx.sellerMemberId] = (balance[tx.sellerMemberId] ?? 0) - parseFloat(tx.sharesCount)
    }
    return balance
  }, [transactions])

  const calculatedShares = useMemo(() => {
    const cash = parseFloat(issueForm.cashAmount)
    if (isNaN(cash) || cash <= 0) return 0
    return cash / navPrice
  }, [issueForm.cashAmount, navPrice])

  const selectedSellerBalance = useMemo(() => {
    const id = Number(transferForm.sellerId)
    return memberShareBalance[id] ?? 0
  }, [transferForm.sellerId, memberShareBalance])

  async function handleIssueShares() {
    if (!issueForm.memberId) { toast.error("Select a member"); return }
    const cash = parseFloat(issueForm.cashAmount)
    if (isNaN(cash) || cash < navPrice) { toast.error(`Minimum cash injection is Rs. ${navPrice.toLocaleString()}`); return }
    const shares = cash / navPrice

    setSaving(true)
    try {
      await createTransaction.mutateAsync({
        transactionType: "initial_issuance",
        buyerMemberId: Number(issueForm.memberId),
        sharesCount: shares,
        pricePerShare: navPrice,
        notes: `Cash injection: Rs. ${cash.toLocaleString()}`,
      })
      toast.success(`${shares.toFixed(2)} shares issued`)
      setIssueDialogOpen(false)
      setIssueForm({ memberId: "", cashAmount: "" })
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleTransfer() {
    if (!transferForm.sellerId || !transferForm.buyerId) { toast.error("Select seller and buyer"); return }
    if (transferForm.sellerId === transferForm.buyerId) { toast.error("Seller and buyer must be different"); return }
    const count = parseFloat(transferForm.sharesCount)
    if (isNaN(count) || count <= 0) { toast.error("Enter a valid share count"); return }
    if (count > selectedSellerBalance) { toast.error(`Insufficient shares. Seller has ${selectedSellerBalance.toFixed(2)} shares.`); return }

    setSaving(true)
    try {
      await createTransaction.mutateAsync({
        transactionType: "internal_transfer",
        sellerMemberId: Number(transferForm.sellerId),
        buyerMemberId: Number(transferForm.buyerId),
        sharesCount: count,
        pricePerShare: parseFloat(transferForm.pricePerShare) || navPrice,
        notes: transferForm.notes || undefined,
      })
      toast.success("Shares transferred")
      setTransferDialogOpen(false)
      setTransferForm({ sellerId: "", buyerId: "", sharesCount: "", pricePerShare: "", notes: "" })
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setSaving(false)
    }
  }

  function formatDate(d: string) {
    return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
  }

  return (
    <PageTransition>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-emerald-500 to-cyan-500 bg-clip-text text-transparent">Shares</h1>
          <p className="text-sm text-muted-foreground">Issue shares and transfer equity between members.</p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button onClick={() => setIssueDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Issue Initial Shares
          </Button>
          <Button variant="secondary" onClick={() => setTransferDialogOpen(true)}>
            <ArrowLeftRight className="h-4 w-4 mr-2" />
            Transfer Shares
          </Button>
        </div>

        {!isLoading && transactions.length > 0 && (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
            <Card className="bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/60 dark:to-background border-blue-100 dark:border-blue-900/50">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Shares Issued</CardTitle>
                <ArrowLeftRight className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  <AnimatedCounter to={Math.round(totalShares * 100) / 100} decimals={2} />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-950/60 dark:to-background border-emerald-100 dark:border-emerald-900/50">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Transaction Value</CardTitle>
                <Banknote className="h-4 w-4 text-emerald-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  <PrivacyAmount>Rs. {Math.round(totalValue).toLocaleString()}</PrivacyAmount>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-violet-50 to-white dark:from-violet-950/60 dark:to-background border-violet-100 dark:border-violet-900/50">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Transactions</CardTitle>
                <ArrowLeftRight className="h-4 w-4 text-violet-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold"><AnimatedCounter to={transactions.length} /></div>
              </CardContent>
            </Card>
          </div>
        )}

        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
              <CardTitle className="text-base">Transaction History</CardTitle>
              <div className="flex gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:flex-initial">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by member..."
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                    className="pl-8 h-9 w-full sm:w-[200px]"
                  />
                  {search && (
                    <button onClick={() => setSearch("")} className="absolute right-2 top-2.5 text-muted-foreground hover:text-foreground">
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setPage(1) }}>
                  <SelectTrigger className="h-9 w-[140px]">
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="initial_issuance">Initial Issue</SelectItem>
                    <SelectItem value="internal_transfer">Transfer</SelectItem>
                    <SelectItem value="equity_withdrawal">Withdrawal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
              </div>
            ) : transactions.length === 0 ? (
              <EmptyState
                icon={ArrowLeftRight}
                title="No transactions yet"
                description="Issue initial shares to get started."
                action={<Button onClick={() => setIssueDialogOpen(true)}><Plus className="h-4 w-4 mr-2" />Issue Initial Shares</Button>}
              />
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Seller</TableHead>
                        <TableHead>Buyer</TableHead>
                        <TableHead className="text-right">Shares</TableHead>
                        <TableHead className="text-right">Price/Share</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginated.map((tx) => (
                        <TableRow key={tx.id}>
                          <TableCell className="text-sm text-muted-foreground">{formatDate(tx.transactionDate)}</TableCell>
                          <TableCell>{getTypeBadge(tx.transactionType)}</TableCell>
                          <TableCell>{tx.sellerName ?? "—"}</TableCell>
                          <TableCell>{tx.buyerName ?? "—"}</TableCell>
                          <TableCell className="text-right font-medium">{parseFloat(tx.sharesCount).toFixed(2)}</TableCell>
                          <TableCell className="text-right">
                            <PrivacyAmount>Rs. {parseFloat(tx.pricePerShare).toLocaleString()}</PrivacyAmount>
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            <PrivacyAmount>Rs. {parseFloat(tx.totalAmount).toLocaleString()}</PrivacyAmount>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <DataTablePagination
                  currentPage={safePage}
                  totalPages={totalPages}
                  totalItems={transactions.length}
                  pageSize={pageSize}
                  onPageChange={setPage}
                  onPageSizeChange={setPageSize}
                />
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <SlideOver
        open={issueDialogOpen}
        onOpenChange={setIssueDialogOpen}
        title="Issue Initial Shares"
        description="Issue shares to a member for a cash capital injection."
        gradient="shares"
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Member</Label>
            <Select value={issueForm.memberId} onValueChange={(v) => setIssueForm({ ...issueForm, memberId: v })}>
              <SelectTrigger>
                <SelectValue placeholder="Select member" />
              </SelectTrigger>
              <SelectContent>
                {members.map((m) => (
                  <SelectItem key={m.id} value={String(m.id)}>{m.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Cash Amount (Rs.)</Label>
            <Input
              type="number"
              min="0"
                step={navPrice}
                value={issueForm.cashAmount}
                onChange={(e) => setIssueForm({ ...issueForm, cashAmount: e.target.value })}
                placeholder="e.g. 50000"
            />
              {calculatedShares > 0 && (
                <p className="text-sm text-muted-foreground">
                  This will issue <strong>{calculatedShares.toFixed(2)} shares</strong> at Rs. {navPrice.toLocaleString()}/share.
                </p>
              )}
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setIssueDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleIssueShares} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Issue Shares
            </Button>
          </div>
        </div>
      </SlideOver>

      <SlideOver
        open={transferDialogOpen}
        onOpenChange={setTransferDialogOpen}
        title="Transfer Shares"
        description="Transfer shares between members."
        gradient="shares"
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Seller</Label>
            <Select value={transferForm.sellerId} onValueChange={(v) => setTransferForm({ ...transferForm, sellerId: v })}>
              <SelectTrigger>
                <SelectValue placeholder="Select seller" />
              </SelectTrigger>
              <SelectContent>
                {members.filter((m) => (memberShareBalance[m.id] ?? 0) > 0).map((m) => (
                  <SelectItem key={m.id} value={String(m.id)}>
                    {m.name} ({(memberShareBalance[m.id] ?? 0).toFixed(2)} shares)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Buyer</Label>
            <Select value={transferForm.buyerId} onValueChange={(v) => setTransferForm({ ...transferForm, buyerId: v })}>
              <SelectTrigger>
                <SelectValue placeholder="Select buyer" />
              </SelectTrigger>
              <SelectContent>
                {members.filter((m) => String(m.id) !== transferForm.sellerId).map((m) => (
                  <SelectItem key={m.id} value={String(m.id)}>{m.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Shares to Transfer *</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={transferForm.sharesCount}
                onChange={(e) => setTransferForm({ ...transferForm, sharesCount: e.target.value })}
                placeholder="e.g. 10"
              />
              {transferForm.sellerId && (
                <p className="text-xs text-muted-foreground">Seller balance: {selectedSellerBalance.toFixed(2)} shares</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Price per Share (Rs.)</Label>
              <Input
                type="number"
                min="0"
                step="100"
                value={transferForm.pricePerShare}
                onChange={(e) => setTransferForm({ ...transferForm, pricePerShare: e.target.value })}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Notes</Label>
            <Input value={transferForm.notes} onChange={(e) => setTransferForm({ ...transferForm, notes: e.target.value })} placeholder="Optional notes" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setTransferDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleTransfer} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Transfer
            </Button>
          </div>
        </div>
      </SlideOver>

    </PageTransition>
  )
}
