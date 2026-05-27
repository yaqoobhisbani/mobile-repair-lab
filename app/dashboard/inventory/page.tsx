"use client"

import { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import { toast } from "sonner"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/empty-state"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { DataTablePagination } from "@/components/data-table-pagination"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Search, AlertTriangle, X, Pencil, Trash2, Package, DollarSign, XCircle, Boxes } from "lucide-react"
import { PageTransition, StaggerContainer, StaggerItem, HoverCard } from "@/components/page-transition"
import { AnimatedCounter } from "@/components/animated-counter"
import { useConfirm } from "@/hooks/use-confirm"

interface InventoryItem {
  id: number
  partName: string
  sku: string
  compatibility: string | null
  stockQty: number
  lowStockThreshold: number | null
  costPrice: string | null
  sellingPrice: string | null
}

const ITEMS_PER_PAGE = 7

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [stockFilter, setStockFilter] = useState("all")
  const [page, setPage] = useState(1)
  const [error, setError] = useState("")
  const { confirm, dialog } = useConfirm()

  useEffect(() => {
    fetch("/api/inventory")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch")
        return res.json()
      })
      .then((data) => setItems(data.items ?? []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (error) toast.error(error)
  }, [error])

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return items.filter((item) => {
      const threshold = item.lowStockThreshold ?? 0
      const isLow = item.stockQty <= threshold && item.stockQty > 0
      const isOut = item.stockQty === 0

      const matchesSearch =
        !q ||
        item.partName.toLowerCase().includes(q) ||
        item.sku.toLowerCase().includes(q) ||
        (item.compatibility ?? "").toLowerCase().includes(q)

      const matchesStock =
        stockFilter === "all" ||
        (stockFilter === "low" && isLow) ||
        (stockFilter === "out" && isOut) ||
        (stockFilter === "in" && !isLow && !isOut)

      return matchesSearch && matchesStock
    })
  }, [items, search, stockFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE))
  const safePage = Math.min(page, totalPages)
  const paginated = filtered.slice((safePage - 1) * ITEMS_PER_PAGE, safePage * ITEMS_PER_PAGE)

  const stats = useMemo(() => {
    const totalParts = items.length
    const totalStock = items.reduce((s, i) => s + i.stockQty, 0)
    const lowStock = items.filter((i) => {
      const threshold = i.lowStockThreshold ?? 0
      return i.stockQty <= threshold && i.stockQty > 0
    }).length
    const outOfStock = items.filter((i) => i.stockQty === 0).length

    const totalInvestment = items.reduce((s, i) => {
      return s + (i.costPrice ? Number(i.costPrice) * i.stockQty : 0)
    }, 0)

    const totalValue = items.reduce((s, i) => {
      return s + (i.sellingPrice ? Number(i.sellingPrice) * i.stockQty : 0)
    }, 0)

    return { totalParts, totalStock, lowStock, outOfStock, totalInvestment, totalValue }
  }, [items])

  const hasFilters = search || stockFilter !== "all"

  const handleDelete = async (id: number, name: string) => {
    const ok = await confirm({ title: "Delete part", description: `Delete "${name}"? This cannot be undone.`, variant: "destructive" })
    if (!ok) return

    const res = await fetch(`/api/inventory/${id}`, { method: "DELETE" })
    if (res.ok) {
      setItems((prev) => prev.filter((i) => i.id !== id))
      toast.success("Item deleted successfully")
    } else {
      toast.error("Failed to delete item")
    }
  }

  const clearFilters = () => {
    setSearch("")
    setStockFilter("all")
    setPage(1)
  }

  return (
    <PageTransition>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">Inventory</h1>
            <p className="text-muted-foreground">Manage spare parts and components.</p>
          </div>
          <Link href="/dashboard/inventory/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Part
            </Button>
          </Link>
        </div>

        {!loading && (
          <StaggerContainer className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <StaggerItem>
              <HoverCard>
                <Card className="bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/60 dark:to-background border-blue-100 dark:border-blue-900/50">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Total Parts</CardTitle>
                    <Package className="h-4 w-4 text-blue-500" />
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold"><AnimatedCounter to={stats.totalParts} /></p>
                  </CardContent>
                </Card>
              </HoverCard>
            </StaggerItem>
            <StaggerItem>
              <HoverCard>
                <Card className="bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-950/60 dark:to-background border-emerald-100 dark:border-emerald-900/50">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Total Stock</CardTitle>
                    <Boxes className="h-4 w-4 text-emerald-500" />
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold"><AnimatedCounter to={stats.totalStock} /></p>
                  </CardContent>
                </Card>
              </HoverCard>
            </StaggerItem>
            <StaggerItem>
              <HoverCard>
                <Card className="bg-gradient-to-br from-violet-50 to-white dark:from-violet-950/60 dark:to-background border-violet-100 dark:border-violet-900/50">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Investment</CardTitle>
                    <DollarSign className="h-4 w-4 text-violet-500" />
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold"><AnimatedCounter to={Math.round(stats.totalInvestment)} prefix="Rs. " /></p>
                  </CardContent>
                </Card>
              </HoverCard>
            </StaggerItem>
            <StaggerItem>
              <HoverCard>
                <Card className="bg-gradient-to-br from-cyan-50 to-white dark:from-cyan-950/60 dark:to-background border-cyan-100 dark:border-cyan-900/50">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Shelf Value</CardTitle>
                    <DollarSign className="h-4 w-4 text-cyan-500" />
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold"><AnimatedCounter to={Math.round(stats.totalValue)} prefix="Rs. " /></p>
                  </CardContent>
                </Card>
              </HoverCard>
            </StaggerItem>
            <StaggerItem>
              <HoverCard>
                <Card className="bg-gradient-to-br from-amber-50 to-white dark:from-amber-950/60 dark:to-background border-amber-100 dark:border-amber-900/50">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Low Stock</CardTitle>
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-amber-500"><AnimatedCounter to={stats.lowStock} /></p>
                  </CardContent>
                </Card>
              </HoverCard>
            </StaggerItem>
            <StaggerItem>
              <HoverCard>
                <Card className="bg-gradient-to-br from-rose-50 to-white dark:from-rose-950/60 dark:to-background border-rose-100 dark:border-rose-900/50">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Out of Stock</CardTitle>
                    <XCircle className="h-4 w-4 text-rose-500" />
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-destructive"><AnimatedCounter to={stats.outOfStock} /></p>
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
                    placeholder="Search by part name, SKU, or compatibility..."
                    className="pl-9"
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value)
                      setPage(1)
                    }}
                  />
                </div>
                <Select
                  value={stockFilter}
                  onValueChange={(v) => {
                    setStockFilter(v)
                    setPage(1)
                  }}
                >
                  <SelectTrigger className="w-full sm:w-44">
                    <SelectValue placeholder="All Stock" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Stock</SelectItem>
                    <SelectItem value="in">In Stock</SelectItem>
                    <SelectItem value="low">Low Stock</SelectItem>
                    <SelectItem value="out">Out of Stock</SelectItem>
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
                <div className="space-y-4">
                  <Skeleton className="h-8 w-48" />
                  <Skeleton className="h-4 w-64 mt-2" />
                  <div className="space-y-2 pt-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                </div>
              ) : filtered.length === 0 ? (
                items.length === 0 ? (
                  <EmptyState
                    icon={Package}
                    title="No inventory items"
                    description="Get started by adding your first spare part to the inventory."
                    action={
                      <Link href="/dashboard/inventory/new">
                        <Button>
                          <Plus className="h-4 w-4 mr-2" />
                          Add Part
                        </Button>
                      </Link>
                    }
                  />
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    No parts found matching your filters.
                  </div>
                )
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Part Name</TableHead>
                        <TableHead>SKU</TableHead>
                        <TableHead>Compatibility</TableHead>
                        <TableHead>Stock</TableHead>
                        <TableHead>Cost Price</TableHead>
                        <TableHead>Selling Price</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginated.map((item) => {
                        const threshold = item.lowStockThreshold ?? 0
                        const isLow = item.stockQty <= threshold && item.stockQty > 0
                        const isOut = item.stockQty === 0
                        return (
                          <TableRow key={item.id}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{item.partName}</span>
                                {(isLow || isOut) && (
                                  <AlertTriangle className={`h-4 w-4 ${isOut ? "text-destructive" : "text-amber-500"}`} />
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-muted-foreground">{item.sku}</TableCell>
                            <TableCell>{item.compatibility ?? "—"}</TableCell>
                            <TableCell>
                              <Badge variant={isOut ? "destructive" : isLow ? "outline" : "secondary"}>
                                {item.stockQty}
                              </Badge>
                            </TableCell>
                            <TableCell>{item.costPrice ? `Rs. ${Number(item.costPrice).toFixed(2)}` : "—"}</TableCell>
                            <TableCell>{item.sellingPrice ? `Rs. ${Number(item.sellingPrice).toFixed(2)}` : "—"}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Link href={`/dashboard/inventory/${item.id}`}>
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                </Link>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                  onClick={() => handleDelete(item.id, item.partName)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table></div>
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
      {dialog}
    </PageTransition>
  )
}
