"use client"

import { useState, useMemo, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { TicketStatusBadge } from "@/components/ticket-status-badge"
import { DataTablePagination } from "@/components/data-table-pagination"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Search, X, Loader2, Edit, Trash2, Eye } from "lucide-react"

interface Ticket {
  id: string
  customerName: string | null
  brand: string
  model: string
  status: string
  createdAt: string
}

const ITEMS_PER_PAGE = 7

export default function TicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [page, setPage] = useState(1)

  useEffect(() => {
    fetch("/api/tickets")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch")
        return res.json()
      })
      .then((data) => setTickets(data.tickets ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return tickets.filter((t) => {
      const device = `${t.brand} ${t.model}`.toLowerCase()
      const matchesSearch =
        !q ||
        t.id.toLowerCase().includes(q) ||
        (t.customerName ?? "").toLowerCase().includes(q) ||
        device.includes(q)
      const matchesStatus = statusFilter === "all" || t.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [search, statusFilter, tickets])

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE))
  const safePage = Math.min(page, totalPages)
  const paginated = filtered.slice((safePage - 1) * ITEMS_PER_PAGE, safePage * ITEMS_PER_PAGE)

  const hasFilters = search || statusFilter !== "all"

  const stats = useMemo(() => {
    const total = tickets.length
    const active = tickets.filter((t) => t.status !== "completed" && t.status !== "cancelled").length
    const ready = tickets.filter((t) => t.status === "ready_for_pickup").length
    const completed = tickets.filter((t) => t.status === "completed").length
    const cancelled = tickets.filter((t) => t.status === "cancelled").length
    return { total, active, ready, completed, cancelled }
  }, [tickets])

  const clearFilters = () => {
    setSearch("")
    setStatusFilter("all")
    setPage(1)
  }

  const deleteTicket = async (id: string) => {
    if (!confirm("Delete this ticket? This action cannot be undone.")) return
    try {
      const res = await fetch(`/api/tickets/${id}`, { method: "DELETE" })
      if (res.ok) setTickets((prev) => prev.filter((t) => t.id !== id))
    } catch {}
  }

  function formatDate(d: string | null) {
    if (!d) return "—"
    return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Tickets</h1>
          <p className="text-muted-foreground">Manage all repair tickets.</p>
        </div>
        <Link href="/dashboard/tickets/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Ticket
          </Button>
        </Link>
      </div>

      {!loading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Tickets</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stats.total}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-blue-600">{stats.active}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Ready for Pickup</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-emerald-600">{stats.ready}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Completed</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Cancelled</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-red-600">{stats.cancelled}</p>
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
                placeholder="Search by ticket ID, customer name, or device..."
                className="pl-9"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setPage(1)
                }}
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={(v) => {
                setStatusFilter(v)
                setPage(1)
              }}
            >
              <SelectTrigger className="w-full sm:w-44">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="received">Received</SelectItem>
                <SelectItem value="diagnosing">Diagnosing</SelectItem>
                <SelectItem value="awaiting_parts">Awaiting Parts</SelectItem>
                <SelectItem value="repairing">Repairing</SelectItem>
                <SelectItem value="ready_for_pickup">Ready for Pickup</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
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
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              Loading tickets...
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No tickets found matching your filters.
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ticket ID</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Device</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginated.map((ticket) => (
                    <TableRow key={ticket.id}>
                      <TableCell className="font-medium">
                        <Link href={`/dashboard/tickets/${ticket.id}`} className="hover:underline">
                          {ticket.id}
                        </Link>
                      </TableCell>
                      <TableCell>{ticket.customerName ?? "—"}</TableCell>
                      <TableCell>{ticket.brand} {ticket.model}</TableCell>
                      <TableCell><TicketStatusBadge status={ticket.status} /></TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Link href={`/dashboard/tickets/${ticket.id}`}>
                            <Button variant="ghost" size="icon">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button variant="ghost" size="icon" onClick={() => deleteTicket(ticket.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                          <Link href={`/dashboard/tickets/${ticket.id}`}>
                            <Button variant="ghost" size="icon">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
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
