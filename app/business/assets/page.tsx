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
import { Plus, Search, X, Edit, Trash2, Package, Loader2 } from "lucide-react"
import { PageTransition } from "@/components/page-transition"
import { PrivacyAmount } from "@/components/privacy-amount"
import { toast } from "sonner"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/empty-state"
import { useConfirm } from "@/hooks/use-confirm"
import { useBusinessAssets } from "@/hooks/queries/use-business-assets"
import { useBusinessMembers } from "@/hooks/queries/use-business-members"
import { useCreateBusinessAsset } from "@/hooks/mutations/use-create-business-asset"
import { useUpdateBusinessAsset } from "@/hooks/mutations/use-update-business-asset"
import { useDeleteBusinessAsset } from "@/hooks/mutations/use-delete-business-asset"
import { useAccounts } from "@/hooks/queries/use-accounts"

export default function AssetsPage() {
  const { data: assets = [], isLoading } = useBusinessAssets()
  const { data: members = [] } = useBusinessMembers()
  const { data: accounts = [] } = useAccounts()
  const createAsset = useCreateBusinessAsset()
  const updateAsset = useUpdateBusinessAsset()
  const deleteAsset = useDeleteBusinessAsset()
  const { confirm, dialog: confirmDialog } = useConfirm()

  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingAsset, setEditingAsset] = useState<any>(null)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    costPrice: "",
    purchaseDate: new Date().toISOString().split("T")[0],
    purchasedByMemberId: "",
    fundingSource: "member_equity",
    depreciationRate: "",
    accountId: "",
  })

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    if (!q) return assets
    return assets.filter((a) =>
      a.name.toLowerCase().includes(q) ||
      (a.purchasedByName ?? "").toLowerCase().includes(q)
    )
  }, [search, assets])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const safePage = Math.min(page, totalPages)
  const paginated = filtered.slice((safePage - 1) * pageSize, safePage * pageSize)

  function openCreateDialog() {
    setEditingAsset(null)
    setFormData({
      name: "",
      description: "",
      costPrice: "",
      purchaseDate: new Date().toISOString().split("T")[0],
      purchasedByMemberId: "",
      fundingSource: "member_equity",
      depreciationRate: "",
      accountId: "",
    })
    setDialogOpen(true)
  }

  function openEditDialog(asset: any) {
    setEditingAsset(asset)
    setFormData({
      name: asset.name,
      description: asset.description ?? "",
      costPrice: asset.costPrice,
      purchaseDate: new Date(asset.purchaseDate).toISOString().split("T")[0],
      purchasedByMemberId: asset.purchasedByMemberId ? String(asset.purchasedByMemberId) : "",
      fundingSource: asset.fundingSource,
      depreciationRate: asset.depreciationRate ?? "",
      accountId: "",
    })
    setDialogOpen(true)
  }

  async function handleSave() {
    if (!formData.name.trim()) { toast.error("Asset name is required"); return }
    const price = parseFloat(formData.costPrice)
    if (isNaN(price) || price <= 0) { toast.error("Valid cost price is required"); return }

    setSaving(true)
    try {
      if (editingAsset) {
        await updateAsset.mutateAsync({
          id: editingAsset.id,
          name: formData.name,
          description: formData.description || undefined,
          costPrice: price,
          purchaseDate: formData.purchaseDate || undefined,
          purchasedByMemberId: formData.purchasedByMemberId ? Number(formData.purchasedByMemberId) : null,
          fundingSource: formData.fundingSource,
          depreciationRate: formData.depreciationRate || undefined,
          accountId: formData.accountId ? Number(formData.accountId) : null,
        })
        toast.success("Asset updated")
      } else {
        await createAsset.mutateAsync({
          name: formData.name,
          description: formData.description || undefined,
          costPrice: price,
          purchaseDate: formData.purchaseDate || undefined,
          purchasedByMemberId: formData.purchasedByMemberId ? Number(formData.purchasedByMemberId) : null,
          fundingSource: formData.fundingSource,
          depreciationRate: formData.depreciationRate || undefined,
          accountId: formData.accountId ? Number(formData.accountId) : null,
        })
        toast.success("Asset created")
      }
      setDialogOpen(false)
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: number, name: string) {
    const ok = await confirm({
      title: "Delete Asset",
      description: `Remove ${name} from the asset directory?`,
      variant: "destructive",
    })
    if (!ok) return
    deleteAsset.mutate(id, {
      onSuccess: () => toast.success("Asset deleted"),
      onError: (e) => toast.error(e.message),
    })
  }

  function formatDate(d: string) {
    return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
  }

  return (
    <PageTransition>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            {isLoading ? (
              <>
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-4 w-64 mt-2" />
              </>
            ) : (
              <>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-600 to-teal-600 bg-clip-text text-transparent">Assets</h1>
                <p className="text-sm text-muted-foreground">Track physical assets, depreciation, and ownership.</p>
              </>
            )}
          </div>
          <Button onClick={openCreateDialog}>
            <Plus className="h-4 w-4 mr-2" />
            Add Asset
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by asset name or owner..."
                  className="pl-9"
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                />
              </div>
              {search && (
                <Button variant="ghost" size="sm" onClick={() => { setSearch(""); setPage(1) }}>
                  <X className="h-4 w-4 mr-1" /> Clear
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
              </div>
            ) : filtered.length === 0 ? (
              <EmptyState
                icon={Package}
                title="No assets found"
                description={search ? "No assets match your search." : "No business assets added yet."}
                action={!search ? <Button onClick={openCreateDialog}><Plus className="h-4 w-4 mr-2" />Add Asset</Button> : undefined}
              />
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Cost Price</TableHead>
                        <TableHead>Current Value</TableHead>
                        <TableHead>Owner</TableHead>
                        <TableHead>Funding</TableHead>
                        <TableHead>Purchased</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginated.map((asset) => (
                        <TableRow key={asset.id}>
                          <TableCell className="font-medium">
                            {asset.name}
                            {asset.description && (
                              <p className="text-xs text-muted-foreground truncate max-w-[200px]">{asset.description}</p>
                            )}
                          </TableCell>
                          <TableCell>
                            <PrivacyAmount>Rs. {parseFloat(asset.costPrice).toLocaleString()}</PrivacyAmount>
                          </TableCell>
                          <TableCell>
                            <PrivacyAmount>Rs. {parseFloat(asset.currentValue).toLocaleString()}</PrivacyAmount>
                            {parseFloat(asset.depreciationRate ?? "0") > 0 && (
                              <p className="text-xs text-muted-foreground">
                                Depr. {asset.depreciationRate}%/yr
                              </p>
                            )}
                          </TableCell>
                          <TableCell>{asset.purchasedByName ?? "—"}</TableCell>
                          <TableCell>
                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                              asset.fundingSource === "member_equity"
                                ? "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400"
                                : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                            }`}>
                              {asset.fundingSource === "member_equity" ? "Member Equity" : "Shop Funds"}
                            </span>
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">{formatDate(asset.purchaseDate)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button variant="ghost" size="icon" onClick={() => openEditDialog(asset)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => handleDelete(asset.id, asset.name)}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
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

      <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) setEditingAsset(null); setDialogOpen(open) }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingAsset ? "Edit Asset" : "Add Asset"}</DialogTitle>
            <DialogDescription>
              {editingAsset ? "Update asset details." : "Register a new business asset."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
            <div className="space-y-2">
              <Label htmlFor="asset-name">Asset Name *</Label>
              <Input id="asset-name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. Diagnostic Computer" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="asset-desc">Description</Label>
              <Input id="asset-desc" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Optional description" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cost-price">Cost Price (Rs.) *</Label>
                <Input id="cost-price" type="number" min="0" step="0.01" value={formData.costPrice} onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })} placeholder="150000" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="purchase-date">Purchase Date</Label>
                <Input id="purchase-date" type="date" value={formData.purchaseDate} onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="purchased-by">Purchased By</Label>
              <Select value={formData.purchasedByMemberId} onValueChange={(v) => setFormData({ ...formData, purchasedByMemberId: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a member" />
                </SelectTrigger>
                <SelectContent>
                  {members.map((m) => (
                    <SelectItem key={m.id} value={String(m.id)}>{m.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Funding Source</Label>
              <Select value={formData.fundingSource} onValueChange={(v) => setFormData({ ...formData, fundingSource: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="member_equity">Member Equity (Auto-issue shares)</SelectItem>
                  <SelectItem value="shop_funds">Shop Funds</SelectItem>
                </SelectContent>
              </Select>
              {formData.fundingSource === "member_equity" && (
                <p className="text-xs text-muted-foreground mt-1">
                  Shares will be automatically issued at Rs. 1,000/share for the asset cost.
                </p>
              )}
              {formData.fundingSource === "shop_funds" && (
                <div className="mt-2 space-y-2">
                  <Label htmlFor="account">Deduct From Account</Label>
                  <Select value={formData.accountId} onValueChange={(v) => setFormData({ ...formData, accountId: v })}>
                    <SelectTrigger id="account">
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
                    Amount will be deducted from the selected account balance.
                  </p>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="depreciation">Annual Depreciation Rate (%)</Label>
              <Input id="depreciation" type="number" min="0" max="100" step="0.1" value={formData.depreciationRate} onChange={(e) => setFormData({ ...formData, depreciationRate: e.target.value })} placeholder="e.g. 10" />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editingAsset ? "Update" : "Create Asset"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {confirmDialog}
    </PageTransition>
  )
}
