"use client"

import { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DataTablePagination } from "@/components/data-table-pagination"
import { Plus, Search, X, Pencil, Trash2, Users } from "lucide-react"
import { toast } from "sonner"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/empty-state"

interface Customer {
  id: number
  name: string
  phone: string
  email: string | null
  createdAt: string
}

const ITEMS_PER_PAGE = 10

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)

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
    if (!confirm(`Delete customer "${name}"? This cannot be undone.`)) return

    const res = await fetch(`/api/customers/${id}`, { method: "DELETE" })
      if (res.ok) {
        setCustomers((prev) => prev.filter((c) => c.id !== id))
        toast.success("Customer deleted successfully")
      }
  }

  return (
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
              <h1 className="text-2xl font-bold">Customers</h1>
              <p className="text-muted-foreground">Manage your customer directory.</p>
            </>
          )}
        </div>
        <Link href="/dashboard/customers/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Customer
          </Button>
        </Link>
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
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Customers</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stats.total}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">New This Month</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stats.thisMonth}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">With Email</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stats.withEmail}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">No Email</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stats.withoutEmail}</p>
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
                  <Link href="/dashboard/customers/new">
                    <Button><Plus className="h-4 w-4 mr-2" />Add Customer</Button>
                  </Link>
                ) : undefined
              }
            />
          ) : (
            <>
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
                          <Link href={`/dashboard/customers/${customer.id}`}>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </Link>
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
