"use client"

import { useState, useMemo, useEffect, useCallback } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { TicketStatusBadge } from "@/components/ticket-status-badge"
import { DataTablePagination } from "@/components/data-table-pagination"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Search, X, Edit, Trash2, Eye, ClipboardList } from "lucide-react"
import { PageTransition, StaggerContainer, StaggerItem, HoverCard } from "@/components/page-transition"
import { AnimatedCounter } from "@/components/animated-counter"
import { toast } from "sonner"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/empty-state"
import { useConfirm } from "@/hooks/use-confirm"
import { SlideOver } from "@/components/slide-over"
import { CreateTicketForm } from "@/components/forms/create-ticket-form"

interface Ticket {
  id: string
  customerName: string | null
  brand: string
  model: string
  status: string
  createdAt: string
}

export default function TicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [error, setError] = useState("")
  const { confirm, dialog } = useConfirm()
  const [slideOverOpen, setSlideOverOpen] = useState(false)
  const [pageSize, setPageSize] = useState(10)
  const [page, setPage] = useState(1)

  const openSlide = useCallback(() => setSlideOverOpen(true), [])
  const closeSlide = useCallback(() => setSlideOverOpen(false), [])

  const refreshTickets = useCallback(async () => {
    await fetch("/api/tickets")
      .then((res) => res.json())
      .then((data) => setTickets(data.tickets ?? []))
  }, [])

  useEffect(() => {
    if (error) toast.error(error)
  }, [error])

  useEffect(() => {
    fetch("/api/tickets")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch")
        return res.json()
      })
      .then((data) => setTickets(data.tickets ?? []))
      .catch((err) => setError(err.message))
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

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const safePage = Math.min(page, totalPages)
  const paginated = filtered.slice((safePage - 1) * pageSize, safePage * pageSize)

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
    const ok = await confirm({ title: "Delete Ticket", description: "Delete this ticket? This action cannot be undone.", variant: "destructive" }); if (!ok) return
    try {
      const res = await fetch(`/api/tickets/${id}`, { method: "DELETE" })
      if (res.ok) {
        setTickets((prev) => prev.filter((t) => t.id !== id))
        toast.success("Ticket deleted successfully")
      }
    } catch {}
  }

  function formatDate(d: string | null) {
    if (!d) return "—"
    return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" })
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
              <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-600 to-teal-600 bg-clip-text text-transparent">Tickets</h1>
              <p className="text-muted-foreground">Manage all repair tickets.</p>
            </>
          )}
        </div>
        <Button onClick={openSlide}>
            <Plus className="h-4 w-4 mr-2" />
            New Ticket
          </Button>
      </div>

      {!loading && (
        <StaggerContainer className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <StaggerItem>
            <HoverCard>
              <Card className="bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/60 dark:to-background border-blue-200 dark:border-blue-800">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Tickets</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold"><AnimatedCounter to={stats.total} /></p>
                </CardContent>
              </Card>
            </HoverCard>
          </StaggerItem>
          <StaggerItem>
            <HoverCard>
              <Card className="bg-gradient-to-br from-amber-50 to-white dark:from-amber-950/60 dark:to-background border-amber-200 dark:border-amber-800">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Active</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold"><AnimatedCounter to={stats.active} /></p>
                </CardContent>
              </Card>
            </HoverCard>
          </StaggerItem>
          <StaggerItem>
            <HoverCard>
              <Card className="bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-950/60 dark:to-background border-emerald-200 dark:border-emerald-800">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Ready for Pickup</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold"><AnimatedCounter to={stats.ready} /></p>
                </CardContent>
              </Card>
            </HoverCard>
          </StaggerItem>
          <StaggerItem>
            <HoverCard>
              <Card className="bg-gradient-to-br from-green-50 to-white dark:from-green-950/60 dark:to-background border-green-200 dark:border-green-800">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Completed</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold"><AnimatedCounter to={stats.completed} /></p>
                </CardContent>
              </Card>
            </HoverCard>
          </StaggerItem>
          <StaggerItem>
            <HoverCard>
              <Card className="bg-gradient-to-br from-rose-50 to-white dark:from-rose-950/60 dark:to-background border-rose-200 dark:border-rose-800">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Cancelled</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold"><AnimatedCounter to={stats.cancelled} /></p>
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
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={ClipboardList}
              title="No tickets found"
              description={hasFilters ? "No tickets match your search or filters." : "No repair tickets have been created yet."}
              action={
                !hasFilters ? (
                  <Button onClick={openSlide}>
                      <Plus className="h-4 w-4 mr-2" />
                      New Ticket
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
              </Table></div>
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
        title="New Ticket"
        description="Create a new repair ticket."
        gradient="tickets"
      >
        <CreateTicketForm onSuccess={() => { closeSlide(); refreshTickets() }} onCancel={closeSlide} />
      </SlideOver>
    </PageTransition>
  )
}
