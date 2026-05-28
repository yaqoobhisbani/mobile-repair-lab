"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DataTablePagination } from "@/components/data-table-pagination"
import { Plus, Search, X, Pencil, Trash2, Users, Mail, MailX, UserPlus } from "lucide-react"
import { PageTransition, StaggerContainer, StaggerItem, HoverCard } from "@/components/page-transition"
import { AnimatedCounter } from "@/components/animated-counter"
import { toast } from "sonner"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/empty-state"
import { useConfirm } from "@/hooks/use-confirm"
import { SlideOver } from "@/components/slide-over"
import { CreateCustomerForm } from "@/components/forms/create-customer-form"
import { EditCustomerForm } from "@/components/forms/edit-customer-form"

interface Customer {
  id: number
  name: string
  phone: string
  email: string | null
  createdAt: string
}

const ITEMS_PER_PAGE = 10

export default function CustomersPage() {
  const { confirm, dialog } = useConfirm()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [slideOverOpen, setSlideOverOpen] = useState(false)
  const [editCustomerId, setEditCustomerId] = useState<number | null>(null)

  const openCreateSlide = useCallback(() => {
    setEditCustomerId(null)
    setSlideOverOpen(true)
  }, [])

  const openEditSlide = useCallback((id: number) => {
    setEditCustomerId(id)
    setSlideOverOpen(true)
  }, [])

  const closeSlide = useCallback(() => {
    setSlideOverOpen(false)
    setEditCustomerId(null)
  }, [])

  const refreshItems = useCallback(async () => {
    await fetch("/api/customers")
      .then((res) => res.json())
      .then((data) => setCustomers(data.customers ?? []))
  }, [])

  useEffect(() => {
    fetch("/api/customers")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch")
        return res.json()
      })
      .then((data) => setCustomers(data.customers ?? []))
      .catch(() => toast.error("Failed to load customers"))
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    if (!q) return customers
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        (c.email ?? "").toLowerCase().includes(q)
    )
  }, [customers, search])

  const stats = useMemo(() => {
    const total = customers.length
    const withEmail = customers.filter((c) => c.email).length
    const withoutEmail = total - withEmail
    const now = new Date()
    const thisMonth = customers.filter((c) => {
      const d = new Date(c.createdAt)
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    }).length

    return { total, withEmail, withoutEmail, thisMonth }
  }, [customers])

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE))
  const safePage = Math.min(page, totalPages)
  const paginated = filtered.slice((safePage - 1) * ITEMS_PER_PAGE, safePage * ITEMS_PER_PAGE)

  const handleDelete = async (id: number, name: string) => {
    const ok = await confirm({ title: "Delete customer", description: `Delete customer "${name}"? This cannot be undone.`, variant: "destructive" }); if (!ok) return

    const res = await fetch(`/api/customers/${id}`, { method: "DELETE" })
      if (res.ok) {
        setCustomers((prev) => prev.filter((c) => c.id !== id))
        toast.success("Customer deleted successfully")
      }
  }

  return (
    <PageTransition>
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          {loading ? (
            <>
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-64 mt-2" />
            </>
          ) : (
            <>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">Customers</h1>
              <p className="text-muted-foreground">Manage your customer directory.</p>
            </>
          )}
        </div>
        <Button onClick={openCreateSlide}>
            <Plus className="h-4 w-4 mr-2" />
            Add Customer
          </Button>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <StaggerContainer className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StaggerItem>
            <HoverCard>
              <Card className="bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/60 dark:to-background border-blue-100 dark:border-blue-900/50">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Customers</CardTitle>
                  <Users className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">
                    <AnimatedCounter to={stats.total} />
                  </p>
                </CardContent>
              </Card>
            </HoverCard>
          </StaggerItem>
          <StaggerItem>
            <HoverCard>
              <Card className="bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-950/60 dark:to-background border-emerald-100 dark:border-emerald-900/50">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">New This Month</CardTitle>
                  <UserPlus className="h-4 w-4 text-emerald-500" />
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">
                    <AnimatedCounter to={stats.thisMonth} />
                  </p>
                </CardContent>
              </Card>
            </HoverCard>
          </StaggerItem>
          <StaggerItem>
            <HoverCard>
              <Card className="bg-gradient-to-br from-violet-50 to-white dark:from-violet-950/60 dark:to-background border-violet-100 dark:border-violet-900/50">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">With Email</CardTitle>
                  <Mail className="h-4 w-4 text-violet-500" />
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">
                    <AnimatedCounter to={stats.withEmail} />
                  </p>
                </CardContent>
              </Card>
            </HoverCard>
          </StaggerItem>
          <StaggerItem>
            <HoverCard>
              <Card className="bg-gradient-to-br from-amber-50 to-white dark:from-amber-950/60 dark:to-background border-amber-100 dark:border-amber-900/50">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">No Email</CardTitle>
                  <MailX className="h-4 w-4 text-amber-500" />
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">
                    <AnimatedCounter to={stats.withoutEmail} />
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
                placeholder="Search by name, phone, or email..."
                className="pl-9"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setPage(1)
                }}
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
            <EmptyState
              icon={Users}
              title="No customers"
              description={
                customers.length === 0
                  ? "Add your first customer to get started."
                  : "No customers found matching your search."
              }
              action={
                customers.length === 0 ? (
                  <Button onClick={openCreateSlide}><Plus className="h-4 w-4 mr-2" />Add Customer</Button>
                ) : undefined
              }
            />
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Added</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginated.map((customer) => (
                    <TableRow key={customer.id}>
                      <TableCell className="font-medium">{customer.name}</TableCell>
                      <TableCell>{customer.phone}</TableCell>
                      <TableCell className="text-muted-foreground">{customer.email ?? "—"}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(customer.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => openEditSlide(customer.id)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => handleDelete(customer.id, customer.name)}
                          >
                            <Trash2 className="h-4 w-4" />
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
                pageSize={ITEMS_PER_PAGE}
                onPageChange={setPage}
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
        title={editCustomerId ? "Edit Customer" : "Add Customer"}
        description={editCustomerId ? "Update the customer details below." : "Add a new customer to your directory."}
        gradient="customers"
      >
        {editCustomerId ? (
          <EditCustomerForm customerId={editCustomerId} onSuccess={() => { closeSlide(); refreshItems() }} onCancel={closeSlide} />
        ) : (
          <CreateCustomerForm onSuccess={() => { closeSlide(); refreshItems() }} onCancel={closeSlide} />
        )}
      </SlideOver>
    </PageTransition>
  )
}
