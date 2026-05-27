"use client"

import { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { DataTablePagination } from "@/components/data-table-pagination"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Search, AlertTriangle, X, Loader2, Pencil, Trash2 } from "lucide-react"

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

  useEffect(() => {
    fetch("/api/inventory")
      .then((res) => res.json())
      .then((data) => setItems(data.items))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

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
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return

    const res = await fetch(`/api/inventory/${id}`, { method: "DELETE" })
    if (res.ok) {
      setItems((prev) => prev.filter((i) => i.id !== id))
    }
  }

  const clearFilters = () => {
    setSearch("")
    setStockFilter("all")
    setPage(1)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Inventory</h1>
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
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Parts</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stats.totalParts}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Stock</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stats.totalStock}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Investment</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">Rs. {stats.totalInvestment.toFixed(0)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Shelf Value</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">Rs. {stats.totalValue.toFixed(0)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Low Stock</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-amber-500">{stats.lowStock}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Out of Stock</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-destructive">{stats.outOfStock}</p>
            </CardContent>
          </Card>
        </div>
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
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {items.length === 0 ? "No parts in inventory. Add your first part!" : "No parts found matching your filters."}
            </div>
          ) : (
            <>
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
