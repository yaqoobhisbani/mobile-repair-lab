"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { use } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { TicketStatusBadge } from "@/components/ticket-status-badge"
import { AddPartDialog } from "@/components/add-part-dialog"
import { ArrowLeft, Download, Edit, Loader2, Plus, Trash2 } from "lucide-react"

interface TicketData {
  id: string
  customerId: number
  customerName: string | null
  customerPhone: string | null
  customerEmail: string | null
  brand: string
  model: string
  imei: string | null
  passcode: string | null
  problemCategory: string | null
  problemDescription: string | null
  status: string
  paymentStatus: string
  paymentAccountId: number | null
  paymentAccountName: string | null
  laborCost: string | null
  estimatedCompletion: string | null
  createdAt: string
}

interface TicketItem {
  id: number
  inventoryId: number
  partName: string | null
  sku: string | null
  quantityUsed: number
  sellingPrice: string | null
}

interface Account {
  id: number
  name: string
  type: string
}

const paymentStatusOptions = [
  { value: "unpaid", label: "Unpaid" },
  { value: "partially_paid", label: "Partially Paid" },
  { value: "paid", label: "Paid" },
]

const paymentStatusBadgeVariant: Record<string, "secondary" | "default" | "outline"> = {
  unpaid: "secondary",
  partially_paid: "outline",
  paid: "default",
}

const statusOptions = [
  { value: "received", label: "Received" },
  { value: "diagnosing", label: "Diagnosing" },
  { value: "awaiting_parts", label: "Awaiting Parts" },
  { value: "repairing", label: "Repairing" },
  { value: "ready_for_pickup", label: "Ready for Pickup" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
]

function formatDate(d: string | null) {
  if (!d) return "—"
  return new Date(d).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
}

export default function TicketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [ticket, setTicket] = useState<TicketData | null>(null)
  const [items, setItems] = useState<TicketItem[]>([])
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [editDescription, setEditDescription] = useState("")
  const [editImei, setEditImei] = useState("")
  const [editPasscode, setEditPasscode] = useState("")
  const [editLaborCost, setEditLaborCost] = useState("")
  const [saving, setSaving] = useState(false)
  const [showAddPart, setShowAddPart] = useState(false)
  const [accounts, setAccounts] = useState<Account[]>([])

  useEffect(() => {
    fetch(`/api/tickets/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setTicket(data.ticket)
        setItems(data.items)
        setEditDescription(data.ticket.problemDescription ?? "")
        setEditImei(data.ticket.imei ?? "")
        setEditPasscode(data.ticket.passcode ?? "")
        setEditLaborCost(data.ticket.laborCost ?? "")
      })
      .catch(() => {})
      .finally(() => setLoading(false))

    fetch("/api/accounts")
      .then((res) => res.json())
      .then((data) => setAccounts(data.accounts))
      .catch(() => {})
  }, [id])

  const updateStatus = async (newStatus: string) => {
    if (!ticket) return
    setSaving(true)
    try {
      const res = await fetch(`/api/tickets/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })
      if (res.ok) {
        setTicket({ ...ticket, status: newStatus })
      }
    } catch {}
    setSaving(false)
  }

  const saveEdits = async () => {
    if (!ticket) return
    setSaving(true)
    try {
      const res = await fetch(`/api/tickets/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          problemDescription: editDescription || null,
          imei: editImei || null,
          passcode: editPasscode || null,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        setTicket({ ...ticket, ...data.ticket })
      }
    } catch {}
    setSaving(false)
    setIsEditing(false)
  }

  const saveLaborCost = async () => {
    if (!ticket) return
    try {
      const res = await fetch(`/api/tickets/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ laborCost: editLaborCost || null }),
      })
      if (res.ok) {
        const data = await res.json()
        setTicket((prev) => prev ? { ...prev, ...data.ticket } : null)
      }
    } catch {}
  }

  const updatePayment = async (paymentStatus: string, paymentAccountId?: number | null) => {
    if (!ticket) return
    const body: Record<string, any> = { paymentStatus }
    if (paymentAccountId !== undefined) body.paymentAccountId = paymentAccountId
    try {
      const res = await fetch(`/api/tickets/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (res.ok) {
        const data = await res.json()
        setTicket((prev) => prev ? { ...prev, ...data.ticket } : null)
      }
    } catch {}
  }

  const removePart = async (itemId: number) => {
    if (!confirm("Remove this part from the ticket? Stock will be restored.")) return
    try {
      const res = await fetch(`/api/tickets/${id}/items`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId }),
      })
      if (res.ok) {
        setItems((prev) => prev.filter((i) => i.id !== itemId))
      }
    } catch {}
  }

  const refreshParts = () => {
    fetch(`/api/tickets/${id}`)
      .then((res) => res.json())
      .then((data) => setItems(data.items))
      .catch(() => {})
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-muted-foreground">
        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
        Loading ticket...
      </div>
    )
  }

  if (!ticket) {
    return (
      <div className="text-center py-24 text-muted-foreground">
        Ticket not found.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/tickets">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">Ticket {id}</h1>
              <TicketStatusBadge status={ticket.status} />
            </div>
            <p className="text-muted-foreground">{ticket.brand} {ticket.model} — {ticket.customerName}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/dashboard/tickets/${id}/invoice`}>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Invoice
            </Button>
          </Link>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (isEditing) saveEdits()
              else setIsEditing(true)
            }}
            disabled={saving}
          >
            {saving ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving...</>
            ) : (
              <><Edit className="h-4 w-4 mr-2" />{isEditing ? "Save" : "Edit"}</>
            )}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Repair Details</CardTitle>
            <CardDescription>Device and issue information.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label className="text-muted-foreground text-xs">Status</Label>
                <Select value={ticket.status} onValueChange={updateStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-muted-foreground text-xs">Estimated Completion</Label>
                <p className="text-sm font-medium">{formatDate(ticket.estimatedCompletion)}</p>
              </div>
              <div>
                <Label className="text-muted-foreground text-xs">Brand</Label>
                <p className="text-sm font-medium">{ticket.brand}</p>
              </div>
              <div>
                <Label className="text-muted-foreground text-xs">Model</Label>
                <p className="text-sm font-medium">{ticket.model}</p>
              </div>
              <div>
                <Label className="text-muted-foreground text-xs">IMEI / Serial</Label>
                {isEditing ? (
                  <Input value={editImei} onChange={(e) => setEditImei(e.target.value)} className="mt-1" />
                ) : (
                  <p className="text-sm font-medium">{ticket.imei || "—"}</p>
                )}
              </div>
              <div>
                <Label className="text-muted-foreground text-xs">Passcode</Label>
                {isEditing ? (
                  <Input value={editPasscode} onChange={(e) => setEditPasscode(e.target.value)} className="mt-1" />
                ) : (
                  <p className="text-sm font-medium">{ticket.passcode ? "****" : "—"}</p>
                )}
              </div>
            </div>
            <Separator />
            <div>
              <Label className="text-muted-foreground text-xs">Problem Category</Label>
              <p className="text-sm font-medium capitalize">{ticket.problemCategory ?? "—"}</p>
            </div>
            <div>
              <Label className="text-muted-foreground text-xs">Problem Description</Label>
              {isEditing ? (
                <textarea
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm mt-1"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                />
              ) : (
                <p className="text-sm text-muted-foreground">{ticket.problemDescription || "—"}</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Customer</CardTitle>
            <CardDescription>Contact information.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label className="text-muted-foreground text-xs">Name</Label>
              <p className="text-sm font-medium">{ticket.customerName}</p>
            </div>
            <div>
              <Label className="text-muted-foreground text-xs">Phone</Label>
              <p className="text-sm font-medium">{ticket.customerPhone || "—"}</p>
            </div>
            <div>
              <Label className="text-muted-foreground text-xs">Email</Label>
              <p className="text-sm font-medium">{ticket.customerEmail || "—"}</p>
            </div>
            <Separator />
            <div>
              <Label className="text-muted-foreground text-xs">Created</Label>
              <p className="text-sm font-medium">{formatDate(ticket.createdAt)}</p>
            </div>
            <Separator />
            <div className="space-y-3">
              <Label className="text-muted-foreground text-xs">Payment Status</Label>
              <Select
                value={ticket.paymentStatus}
                onValueChange={(v) => updatePayment(v, ticket.paymentAccountId)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {paymentStatusOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div>
                <Label className="text-muted-foreground text-xs">Account</Label>
                <Select
                  value={ticket.paymentAccountId ? String(ticket.paymentAccountId) : "none"}
                  onValueChange={(v) => updatePayment(ticket.paymentStatus, v === "none" ? null : Number(v))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select account" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">—</SelectItem>
                    {accounts.map((a) => (
                      <SelectItem key={a.id} value={String(a.id)}>{a.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Parts Used</CardTitle>
              <CardDescription>Inventory items attached to this ticket.</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => setShowAddPart(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Part
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Part</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Qty</TableHead>
                <TableHead>Price</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-6">
                    No parts attached to this ticket.
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.partName}</TableCell>
                    <TableCell>{item.sku}</TableCell>
                    <TableCell>{item.quantityUsed}</TableCell>
                    <TableCell>{item.sellingPrice ? `Rs. ${item.sellingPrice}` : "—"}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => removePart(item.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
              <TableRow>
                <TableCell className="font-medium">Labor / Service Fee</TableCell>
                <TableCell>—</TableCell>
                <TableCell>1</TableCell>
                <TableCell>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={editLaborCost}
                    onChange={(e) => setEditLaborCost(e.target.value)}
                    onBlur={() => saveLaborCost()}
                    className="h-8 w-28"
                  />
                </TableCell>
                <TableCell className="text-right" />
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <AddPartDialog
        open={showAddPart}
        onOpenChange={setShowAddPart}
        ticketId={id}
        onPartAdded={refreshParts}
      />
    </div>
  )
}
