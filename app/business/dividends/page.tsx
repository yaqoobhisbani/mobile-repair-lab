"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DataTablePagination } from "@/components/data-table-pagination"
import { Banknote, Loader2 } from "lucide-react"
import { PageTransition } from "@/components/page-transition"
import { PrivacyAmount } from "@/components/privacy-amount"
import { toast } from "sonner"
import { Skeleton } from "@/components/ui/skeleton"
import { useBusinessDividends } from "@/hooks/queries/use-business-dividends"
import { useDistributeDividends } from "@/hooks/mutations/use-distribute-dividends"
import { useAccounts } from "@/hooks/queries/use-accounts"

export default function DividendsPage() {
  const { data: distributions = [], isLoading } = useBusinessDividends()
  const distributeDividends = useDistributeDividends()
  const { data: accounts = [] } = useAccounts()

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({ totalAmount: "", notes: "", accountId: "" })

  const totalPages = Math.max(1, Math.ceil(distributions.length / pageSize))
  const safePage = Math.min(page, totalPages)
  const paginated = distributions.slice((safePage - 1) * pageSize, safePage * pageSize)

  async function handleDistribute() {
    const amount = parseFloat(formData.totalAmount)
    if (isNaN(amount) || amount <= 0) { toast.error("Enter a valid total amount"); return }

    setSaving(true)
    try {
      await distributeDividends.mutateAsync({
        totalAmount: amount,
        notes: formData.notes || undefined,
        accountId: formData.accountId ? Number(formData.accountId) : null,
      })
      toast.success("Dividends distributed successfully")
      setDialogOpen(false)
      setFormData({ totalAmount: "", notes: "", accountId: "" })
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setSaving(false)
    }
  }

  const totalDistributed = useMemo(
    () => distributions.reduce((sum, d) => sum + parseFloat(d.amount), 0),
    [distributions]
  )

  function formatDate(d: string) {
    return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
  }

  return (
    <PageTransition>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-600 to-teal-600 bg-clip-text text-transparent">Dividends</h1>
            <p className="text-sm text-muted-foreground">Distribute profits to shareholders.</p>
          </div>
          <Button onClick={() => setDialogOpen(true)}>
            <Banknote className="h-4 w-4 mr-2" />
            Distribute Dividends
          </Button>
        </div>

        {!isLoading && distributions.length > 0 && (
          <Card className="bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-950/60 dark:to-background border-emerald-200 dark:border-emerald-800">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Distributed</CardTitle>
              <Banknote className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                <PrivacyAmount>Rs. {totalDistributed.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</PrivacyAmount>
              </div>
              <p className="text-xs text-muted-foreground">Across {distributions.length} payouts</p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Distribution History</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
              </div>
            ) : distributions.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No dividends distributed yet. Use the button above to distribute profits to shareholders.
              </p>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Member</TableHead>
                        <TableHead className="text-right">Shareholding %</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead>Notes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginated.map((d) => (
                        <TableRow key={d.id}>
                          <TableCell className="text-muted-foreground text-sm">{formatDate(d.payoutDate)}</TableCell>
                          <TableCell className="font-medium">{d.memberName ?? "Unknown"}</TableCell>
                          <TableCell className="text-right">{d.shareholdingPercentage}%</TableCell>
                          <TableCell className="text-right font-medium">
                            <PrivacyAmount>Rs. {parseFloat(d.amount).toLocaleString()}</PrivacyAmount>
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">{d.notes ?? "—"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <DataTablePagination
                  currentPage={safePage}
                  totalPages={totalPages}
                  totalItems={distributions.length}
                  pageSize={pageSize}
                  onPageChange={setPage}
                  onPageSizeChange={setPageSize}
                />
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Distribute Dividends</DialogTitle>
            <DialogDescription>Enter the total profit amount to distribute to shareholders.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Total Amount (Rs.)</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={formData.totalAmount}
                onChange={(e) => setFormData({ ...formData, totalAmount: e.target.value })}
                placeholder="e.g. 50000"
              />
              <p className="text-xs text-muted-foreground">
                The system will calculate each member's share based on their current ownership percentage.
              </p>
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Input
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="e.g. Q1 2026 profit distribution"
              />
            </div>
            <div className="space-y-2">
              <Label>Deduct From Account (optional)</Label>
              <Select value={formData.accountId} onValueChange={(v) => setFormData({ ...formData, accountId: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an account" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((a) => (
                    <SelectItem key={a.id} value={String(a.id)}>
                      {a.name} (Rs. {parseFloat(a.balance).toLocaleString()})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                If selected, the total amount will be deducted from this account.
              </p>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleDistribute} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Distribute
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </PageTransition>
  )
}
