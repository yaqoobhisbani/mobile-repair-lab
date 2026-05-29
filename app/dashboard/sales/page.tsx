"use client"

import { useState, useMemo, useCallback } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DataTablePagination } from "@/components/data-table-pagination"
import { PrivacyAmount } from "@/components/privacy-amount"
import { Plus, Search, X, Eye, Trash2, Receipt } from "lucide-react"
import { PageTransition, StaggerContainer, StaggerItem, HoverCard } from "@/components/page-transition"
import { AnimatedCounter } from "@/components/animated-counter"
import { toast } from "sonner"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/empty-state"
import { useConfirm } from "@/hooks/use-confirm"
import { SlideOver } from "@/components/slide-over"
import { CreateSaleForm } from "@/components/forms/create-sale-form"
import { useSales } from "@/hooks/queries/use-sales"
import { useDeleteSale } from "@/hooks/mutations/use-delete-sale"

function formatDate(d: string | null) {
  if (!d) return "\u2014"
  const dt = new Date(d)
  return `${String(dt.getDate()).padStart(2, "0")}/${String(dt.getMonth() + 1).padStart(2, "0")}/${dt.getFullYear()}`
}

function formatCurrency(amount: string) {
  const num = parseFloat(amount)
  return `Rs. ${num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export default function SalesPage() {
  const [search, setSearch] = useState("")
  const { confirm, dialog } = useConfirm()
  const [slideOverOpen, setSlideOverOpen] = useState(false)
  const [pageSize, setPageSize] = useState(10)
  const [page, setPage] = useState(1)

  const { data: sales = [], isLoading } = useSales()
  const deleteSaleMutation = useDeleteSale()

  const openSlide = useCallback(() => setSlideOverOpen(true), [])
  const closeSlide = useCallback(() => setSlideOverOpen(false), [])

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return sales.filter((s) => {
      const matchesSearch =
        !q ||
        s.id.toLowerCase().includes(q) ||
        (s.customerName ?? "").toLowerCase().includes(q) ||
        (s.customerPhone ?? "").includes(q)
      return matchesSearch
    })
  }, [search, sales])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const safePage = Math.min(page, totalPages)
  const paginated = filtered.slice((safePage - 1) * pageSize, safePage * pageSize)

  const hasFilters = !!search

  const stats = useMemo(() => {
    const total = sales.length
    const totalRevenue = sales.reduce((sum, s) => sum + parseFloat(s.totalAmount), 0)
    const now = new Date()
    const thisMonthSales = sales.filter((s) => {
      const d = new Date(s.createdAt)
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    })
    const thisYearSales = sales.filter((s) => {
      const d = new Date(s.createdAt)
      return d.getFullYear() === now.getFullYear()
    })
    const thisMonthRevenue = thisMonthSales.reduce((sum, s) => sum + parseFloat(s.totalAmount), 0)
    const thisYearRevenue = thisYearSales.reduce((sum, s) => sum + parseFloat(s.totalAmount), 0)
    return { total, totalRevenue, thisMonthSales: thisMonthSales.length, thisMonthRevenue, thisYearSales: thisYearSales.length, thisYearRevenue }
  }, [sales])

  const deleteSale = async (id: string) => {
    const ok = await confirm({ title: "Delete Sale", description: "Delete this sale? Inventory stock will be restored and the account will be debited.", variant: "destructive" })
    if (!ok) return
    deleteSaleMutation.mutate(id, {
      onSuccess: () => toast.success("Sale deleted successfully"),
      onError: () => toast.error("Failed to delete sale"),
    })
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
                <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-rose-600 bg-clip-text text-transparent">Sales</h1>
                <p className="text-sm text-muted-foreground">Point of sale - sell inventory items and generate receipts.</p>
              </>
            )}
          </div>
          <Button onClick={openSlide}>
            <Plus className="h-4 w-4 mr-2" />
            New Sale
          </Button>
        </div>

        {!isLoading && (
          <StaggerContainer className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StaggerItem>
              <HoverCard>
                <Card className="bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/60 dark:to-background border-blue-200 dark:border-blue-800">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Total Sales</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-1">
                    <p className="text-2xl font-bold"><AnimatedCounter to={stats.total} /></p>
                    <p className="text-xs text-muted-foreground">All time</p>
                  </CardContent>
                </Card>
              </HoverCard>
            </StaggerItem>
            <StaggerItem>
              <HoverCard>
                <Card className="bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-950/60 dark:to-background border-emerald-200 dark:border-emerald-800">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-1">
                    <p className="text-2xl font-bold">Rs. <PrivacyAmount><AnimatedCounter to={stats.totalRevenue} decimals={2} /></PrivacyAmount></p>
                    <p className="text-xs text-muted-foreground">All time</p>
                  </CardContent>
                </Card>
              </HoverCard>
            </StaggerItem>
            <StaggerItem>
              <HoverCard>
                <Card className="bg-gradient-to-br from-violet-50 to-white dark:from-violet-950/60 dark:to-background border-violet-200 dark:border-violet-800">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">This Month</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-1">
                    <p className="text-2xl font-bold"><PrivacyAmount><AnimatedCounter to={stats.thisMonthSales} /></PrivacyAmount></p>
                    <p className="text-xs text-muted-foreground">Rs. <PrivacyAmount><AnimatedCounter to={stats.thisMonthRevenue} decimals={2} /></PrivacyAmount></p>
                  </CardContent>
                </Card>
              </HoverCard>
            </StaggerItem>
            <StaggerItem>
              <HoverCard>
                <Card className="bg-gradient-to-br from-amber-50 to-white dark:from-amber-950/60 dark:to-background border-amber-200 dark:border-amber-800">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">This Year</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-1">
                    <p className="text-2xl font-bold"><PrivacyAmount><AnimatedCounter to={stats.thisYearSales} /></PrivacyAmount></p>
                    <p className="text-xs text-muted-foreground">Rs. <PrivacyAmount><AnimatedCounter to={stats.thisYearRevenue} decimals={2} /></PrivacyAmount></p>
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
                  placeholder="Search by sale ID, customer name, or phone..."
                  className="pl-9"
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                />
              </div>
              {hasFilters && (
                <Button variant="ghost" size="sm" onClick={() => { setSearch(""); setPage(1) }} className="shrink-0">
                  <X className="h-4 w-4 mr-1" />
                  Clear
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : filtered.length === 0 ? (
              <EmptyState
                icon={Receipt}
                title="No sales found"
                description={hasFilters ? "No sales match your search." : "No sales have been made yet."}
                action={
                  !hasFilters ? (
                    <Button onClick={openSlide}>
                      <Plus className="h-4 w-4 mr-2" />
                      New Sale
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
                        <TableHead>Sale ID</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Account</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginated.map((sale) => (
                        <TableRow key={sale.id}>
                          <TableCell className="font-medium">
                            <Link href={`/dashboard/sales/${sale.id}`} className="hover:underline">
                              {sale.id}
                            </Link>
                          </TableCell>
                          <TableCell>{sale.customerName || "\u2014"}</TableCell>
                          <TableCell>{sale.paymentAccountName || "\u2014"}</TableCell>
                          <TableCell className="text-right font-medium"><PrivacyAmount>{formatCurrency(sale.totalAmount)}</PrivacyAmount></TableCell>
                          <TableCell>{formatDate(sale.createdAt)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Link href={`/dashboard/sales/${sale.id}`}>
                                <Button variant="ghost" size="icon">
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </Link>
                              <Button variant="ghost" size="icon" onClick={() => deleteSale(sale.id)}>
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
      {dialog}

      <SlideOver
        open={slideOverOpen}
        onOpenChange={(open) => { if (!open) closeSlide() }}
        title="New Sale"
        description="Sell products from inventory and process payment."
        gradient="orange"
      >
        <CreateSaleForm onSuccess={() => { closeSlide() }} onCancel={closeSlide} />
      </SlideOver>
    </PageTransition>
  )
}
