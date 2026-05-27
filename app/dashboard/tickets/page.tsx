"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { TicketStatusBadge } from "@/components/ticket-status-badge"
import { DataTablePagination } from "@/components/data-table-pagination"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Search, X } from "lucide-react"

const allTickets = [
  { id: "TKT-001", customer: "Alice Johnson", device: "iPhone 15 Pro", status: "repairing", due: "Jun 1" },
  { id: "TKT-002", customer: "Bob Smith", device: "Galaxy S24", status: "awaiting_parts", due: "Jun 5" },
  { id: "TKT-003", customer: "Carol White", device: "Pixel 8", status: "ready_for_pickup", due: "May 28" },
  { id: "TKT-004", customer: "David Brown", device: "iPhone 14", status: "diagnosing", due: "Jun 3" },
  { id: "TKT-005", customer: "Eve Davis", device: "Galaxy S23", status: "received", due: "Jun 2" },
  { id: "TKT-006", customer: "Frank Miller", device: "iPhone 15 Pro Max", status: "completed", due: "May 25" },
  { id: "TKT-007", customer: "Grace Wilson", device: "Pixel 7", status: "cancelled", due: "—" },
  { id: "TKT-008", customer: "Henry Taylor", device: "iPhone 13", status: "repairing", due: "Jun 6" },
  { id: "TKT-009", customer: "Ivy Chen", device: "Galaxy S22", status: "diagnosing", due: "Jun 4" },
  { id: "TKT-010", customer: "Jack Anderson", device: "Pixel 6", status: "received", due: "Jun 7" },
  { id: "TKT-011", customer: "Karen Lee", device: "iPhone 12", status: "awaiting_parts", due: "Jun 10" },
  { id: "TKT-012", customer: "Leo Martinez", device: "Galaxy S21", status: "ready_for_pickup", due: "May 30" },
  { id: "TKT-013", customer: "Mia Thompson", device: "OnePlus 12", status: "repairing", due: "Jun 8" },
  { id: "TKT-014", customer: "Noah Garcia", device: "iPhone 15", status: "completed", due: "May 27" },
  { id: "TKT-015", customer: "Olivia Brown", device: "Galaxy S24 Ultra", status: "cancelled", due: "—" },
  { id: "TKT-016", customer: "Peter Robinson", device: "Pixel 8 Pro", status: "diagnosing", due: "Jun 9" },
  { id: "TKT-017", customer: "Quinn Davis", device: "iPhone 14 Pro", status: "received", due: "Jun 11" },
  { id: "TKT-018", customer: "Rachel Wilson", device: "Galaxy A54", status: "repairing", due: "Jun 5" },
  { id: "TKT-019", customer: "Sam Harris", device: "OnePlus 11", status: "awaiting_parts", due: "Jun 12" },
  { id: "TKT-020", customer: "Tina Clark", device: "iPhone SE", status: "ready_for_pickup", due: "Jun 1" },
]

const ITEMS_PER_PAGE = 7

export default function TicketsPage() {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [page, setPage] = useState(1)

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return allTickets.filter((t) => {
      const matchesSearch =
        !q ||
        t.id.toLowerCase().includes(q) ||
        t.customer.toLowerCase().includes(q) ||
        t.device.toLowerCase().includes(q)
      const matchesStatus = statusFilter === "all" || t.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [search, statusFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE))
  const safePage = Math.min(page, totalPages)
  const paginated = filtered.slice((safePage - 1) * ITEMS_PER_PAGE, safePage * ITEMS_PER_PAGE)

  const hasFilters = search || statusFilter !== "all"

  const clearFilters = () => {
    setSearch("")
    setStatusFilter("all")
    setPage(1)
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
          {filtered.length === 0 ? (
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
                    <TableHead>Est. Completion</TableHead>
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
                      <TableCell>{ticket.customer}</TableCell>
                      <TableCell>{ticket.device}</TableCell>
                      <TableCell><TicketStatusBadge status={ticket.status} /></TableCell>
                      <TableCell>{ticket.due}</TableCell>
                      <TableCell className="text-right">
                        <Link href={`/dashboard/tickets/${ticket.id}`}>
                          <Button variant="ghost" size="sm">View</Button>
                        </Link>
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
