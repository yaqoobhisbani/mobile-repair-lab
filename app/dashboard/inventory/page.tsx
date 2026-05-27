"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { DataTablePagination } from "@/components/data-table-pagination"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Search, AlertTriangle, X } from "lucide-react"

const allItems = [
  { name: "iPhone 13 OLED Screen", sku: "SCR-IP13-BLK", compat: "iPhone 13", stock: 2, threshold: 5, cost: 89.00, sell: 149.00 },
  { name: "Galaxy S24 Battery", sku: "BAT-GS24", compat: "Galaxy S24", stock: 1, threshold: 3, cost: 25.00, sell: 59.00 },
  { name: "Pixel 8 Charging Port", sku: "CHG-PX8", compat: "Pixel 8", stock: 0, threshold: 2, cost: 12.00, sell: 39.00 },
  { name: "iPhone 15 Pro OLED Screen", sku: "SCR-IP15P-BLK", compat: "iPhone 15 Pro", stock: 8, threshold: 3, cost: 120.00, sell: 199.00 },
  { name: "iPhone SE Battery", sku: "BAT-IPSE3", compat: "iPhone SE (3rd Gen)", stock: 5, threshold: 2, cost: 18.00, sell: 45.00 },
  { name: "Galaxy S23 Ultra Screen", sku: "SCR-GS23U", compat: "Galaxy S23 Ultra", stock: 3, threshold: 2, cost: 150.00, sell: 249.00 },
  { name: "iPhone 15 Pro Max Back Glass", sku: "GL-IP15PM", compat: "iPhone 15 Pro Max", stock: 3, threshold: 4, cost: 35.00, sell: 79.00 },
  { name: "Galaxy S24 Screen Protector", sku: "SCR-PRO-GS24", compat: "Galaxy S24", stock: 15, threshold: 5, cost: 5.00, sell: 15.00 },
  { name: "iPhone 14 Battery", sku: "BAT-IP14", compat: "iPhone 14", stock: 4, threshold: 3, cost: 22.00, sell: 55.00 },
  { name: "Pixel 7 Pro Screen", sku: "SCR-PX7P", compat: "Pixel 7 Pro", stock: 0, threshold: 2, cost: 95.00, sell: 169.00 },
  { name: "iPhone 13 Battery", sku: "BAT-IP13", compat: "iPhone 13", stock: 6, threshold: 2, cost: 20.00, sell: 49.00 },
  { name: "Galaxy S22 Screen", sku: "SCR-GS22", compat: "Galaxy S22", stock: 2, threshold: 3, cost: 80.00, sell: 139.00 },
  { name: "OnePlus 12 Charging Port", sku: "CHG-OP12", compat: "OnePlus 12", stock: 1, threshold: 2, cost: 14.00, sell: 42.00 },
  { name: "iPhone 15 Pro Max Screen", sku: "SCR-IP15PM", compat: "iPhone 15 Pro Max", stock: 5, threshold: 2, cost: 140.00, sell: 229.00 },
  { name: "Galaxy A54 Battery", sku: "BAT-GA54", compat: "Galaxy A54", stock: 7, threshold: 3, cost: 15.00, sell: 39.00 },
]

const ITEMS_PER_PAGE = 7

export default function InventoryPage() {
  const [search, setSearch] = useState("")
  const [stockFilter, setStockFilter] = useState("all")
  const [page, setPage] = useState(1)

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return allItems.filter((item) => {
      const isLow = item.stock <= item.threshold
      const isOut = item.stock === 0

      const matchesSearch =
        !q ||
        item.name.toLowerCase().includes(q) ||
        item.sku.toLowerCase().includes(q) ||
        item.compat.toLowerCase().includes(q)

      const matchesStock =
        stockFilter === "all" ||
        (stockFilter === "low" && isLow && !isOut) ||
        (stockFilter === "out" && isOut) ||
        (stockFilter === "in" && !isLow && !isOut)

      return matchesSearch && matchesStock
    })
  }, [search, stockFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE))
  const safePage = Math.min(page, totalPages)
  const paginated = filtered.slice((safePage - 1) * ITEMS_PER_PAGE, safePage * ITEMS_PER_PAGE)

  const hasFilters = search || stockFilter !== "all"

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
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No parts found matching your filters.
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
                    const isLow = item.stock <= item.threshold
                    const isOut = item.stock === 0
                    return (
                      <TableRow key={item.sku}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{item.name}</span>
                            {(isLow || isOut) && (
                              <AlertTriangle className={`h-4 w-4 ${isOut ? "text-destructive" : "text-amber-500"}`} />
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{item.sku}</TableCell>
                        <TableCell>{item.compat}</TableCell>
                        <TableCell>
                          <Badge variant={isOut ? "destructive" : isLow ? "outline" : "secondary"}>
                            {item.stock}
                          </Badge>
                        </TableCell>
                        <TableCell>Rs. {item.cost.toFixed(2)}</TableCell>
                        <TableCell>Rs. {item.sell.toFixed(2)}</TableCell>
                        <TableCell className="text-right">
                          <Link href={`/dashboard/inventory/${item.sku}`}>
                            <Button variant="ghost" size="sm">Edit</Button>
                          </Link>
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
