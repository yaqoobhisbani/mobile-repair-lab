"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { use } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { TicketStatusBadge } from "@/components/ticket-status-badge"
import { AddPartDialog } from "@/components/add-part-dialog"
import { ArrowLeft, Download, Loader2, Plus, Save, Trash2 } from "lucide-react"
import { capitalize } from "@/lib/utils"
import { toast } from "sonner"
import { useConfirm } from "@/hooks/use-confirm"
import { cn } from "@/lib/utils"

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
  amountPaid: string
  laborCost: string | null
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

interface StatusHistoryEntry {
  id: number
  status: string
  changedAt: string
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

const paymentStatusOptions = [
  { value: "unpaid", label: "Unpaid" },
  { value: "partially_paid", label: "Partially Paid" },
  { value: "paid", label: "Paid" },
]

function formatDate(d: string | null) {
  if (!d) return "—"
  return new Date(d).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
}

export default function TicketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [ticket, setTicket] = useState<TicketData | null>(null)
  const [items, setItems] = useState<TicketItem[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [statusHistory, setStatusHistory] = useState<StatusHistoryEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showAddPart, setShowAddPart] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const [draftStatus, setDraftStatus] = useState("")
  const [draftPaymentStatus, setDraftPaymentStatus] = useState("")
  const [draftPaymentAccountId, setDraftPaymentAccountId] = useState<string>("none")
  const [draftLaborCost, setDraftLaborCost] = useState("")
  const [draftAmountPaid, setDraftAmountPaid] = useState("")
  const [draftImei, setDraftImei] = useState("")
  const [draftPasscode, setDraftPasscode] = useState("")
  const [draftDescription, setDraftDescription] = useState("")
  const { confirm, dialog } = useConfirm()

  const computeTotal = useCallback(() => {
    const partsSum = items.reduce(
      (sum, item) => sum + (parseFloat(item.sellingPrice ?? "0") * item.quantityUsed),
      0
    )
    return partsSum + parseFloat(draftLaborCost || "0")
  }, [items, draftLaborCost])

  useEffect(() => {
    fetch(`/api/tickets/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Not found")
        return res.json()
      })
      .then((data) => {
        setTicket(data.ticket)
        setItems(data.items)
        setStatusHistory(data.statusHistory ?? [])
        setDraftStatus(data.ticket.status)
        setDraftPaymentStatus(data.ticket.paymentStatus)
        setDraftPaymentAccountId(data.ticket.paymentAccountId ? String(data.ticket.paymentAccountId) : "none")
        setDraftLaborCost(data.ticket.laborCost ?? "")
        setDraftAmountPaid(data.ticket.amountPaid ?? "0")
        setDraftImei(data.ticket.imei ?? "")
        setDraftPasscode(data.ticket.passcode ?? "")
        setDraftDescription(data.ticket.problemDescription ?? "")
      })
      .catch(() => {})
      .finally(() => setLoading(false))

    fetch("/api/accounts")
      .then((res) => {
        if (!res.ok) throw new Error()
        return res.json()
      })
      .then((data) => setAccounts(data.accounts))
      .catch(() => {})
  }, [id])

  const hasChanges = ticket && (
    draftStatus !== ticket.status ||
    draftPaymentStatus !== ticket.paymentStatus ||
    draftPaymentAccountId !== (ticket.paymentAccountId ? String(ticket.paymentAccountId) : "none") ||
    draftLaborCost !== (ticket.laborCost ?? "") ||
    draftAmountPaid !== (ticket.amountPaid ?? "0") ||
    draftImei !== (ticket.imei ?? "") ||
    draftPasscode !== (ticket.passcode ?? "") ||
    draftDescription !== (ticket.problemDescription ?? "")
  )

  const handleSave = async () => {
    if (!ticket || !hasChanges) return
    setSaving(true)
    setFieldErrors({})

    const errors: Record<string, string> = {}

    if ((draftPaymentStatus === "paid" || draftPaymentStatus === "partially_paid") && draftPaymentAccountId === "none") {
      errors.paymentAccountId = "Account is required when payment status is Paid or Partially Paid"
    }

    if (draftPaymentStatus === "partially_paid") {
      const amount = parseFloat(draftAmountPaid || "0")
      if (!draftAmountPaid || amount <= 0) {
        errors.amountPaid = "Amount paid must be greater than 0"
      } else if (amount > computeTotal()) {
        errors.amountPaid = `Amount paid (Rs. ${amount.toFixed(2)}) exceeds total (Rs. ${computeTotal().toFixed(2)})`
      }
    }

    if (draftLaborCost && (isNaN(parseFloat(draftLaborCost)) || parseFloat(draftLaborCost) < 0)) {
      errors.laborCost = "Labor cost must be a valid positive number"
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      setSaving(false)
      return
    }

    try {
      const body: Record<string, any> = {
        status: draftStatus,
        paymentStatus: draftPaymentStatus,
        paymentAccountId: draftPaymentAccountId === "none" ? null : Number(draftPaymentAccountId),
        laborCost: draftLaborCost || null,
        imei: draftImei || null,
        passcode: draftPasscode || null,
        problemDescription: draftDescription || null,
      }
      if (draftPaymentStatus === "partially_paid") {
        body.amountPaid = draftAmountPaid || "0"
      }
      const res = await fetch(`/api/tickets/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) {
        setFieldErrors({ form: data.error || "Failed to save changes" })
        setSaving(false)
        return
      }
      setTicket({ ...ticket, ...data.ticket })
      if (draftStatus !== ticket.status) {
        const historyRes = await fetch(`/api/tickets/${id}`)
        if (historyRes.ok) {
          const historyData = await historyRes.json()
          setStatusHistory(historyData.statusHistory ?? [])
        }
      }
      toast.success("Ticket updated successfully")
    } catch {
      setFieldErrors({ form: "Failed to save changes" })
    }
    setSaving(false)
  }

  const removePart = async (itemId: number) => {
    const ok = await confirm({ title: "Remove Part", description: "Remove this part from the ticket? Stock will be restored.", variant: "destructive" }); if (!ok) return
    try {
      const res = await fetch(`/api/tickets/${id}/items`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId }),
      })
      if (res.ok) {
        setItems((prev) => prev.filter((i) => i.id !== itemId))
        toast.success("Part removed from ticket")
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
      {fieldErrors.form && (
        <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
          {fieldErrors.form}
        </div>
      )}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/tickets">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-600 to-teal-600 bg-clip-text text-transparent">Ticket {id}</h1>
              <TicketStatusBadge status={draftStatus} />
            </div>
            <p className="text-muted-foreground">{capitalize(ticket.brand)} {ticket.model} — {ticket.customerName}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/dashboard/tickets/${id}/invoice`}>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Invoice
            </Button>
          </Link>
          <Button onClick={handleSave} disabled={saving || !hasChanges}>
            {saving ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving...</>
            ) : (
              <><Save className="h-4 w-4 mr-2" />Save Changes</>
            )}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Repair Details</CardTitle>
            <CardDescription>Device and issue information.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label className="text-sm font-medium text-muted-foreground">Status</Label>
                <Select value={draftStatus} onValueChange={setDraftStatus}>
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
                <Label className="text-sm font-medium text-muted-foreground">IMEI</Label>
                <Input
                  value={draftImei}
                  onChange={(e) => setDraftImei(e.target.value)}
                  placeholder="IMEI number"
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Passcode</Label>
                <Input
                  value={draftPasscode}
                  onChange={(e) => setDraftPasscode(e.target.value)}
                  placeholder="Device passcode"
                />
              </div>
            </div>
            <Separator />
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Problem Category</Label>
              <p className="text-sm font-medium capitalize mt-1">{ticket.problemCategory ?? "—"}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Problem Description</Label>
              <textarea
                className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm mt-1"
                value={draftDescription}
                onChange={(e) => setDraftDescription(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Customer</CardTitle>
              <CardDescription>Contact information.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Name</span>
                <span className="text-sm font-medium">{ticket.customerName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Phone</span>
                <span className="text-sm">{ticket.customerPhone || "—"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Email</span>
                <span className="text-sm">{ticket.customerEmail || "—"}</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Created</span>
                <span className="text-sm">{formatDate(ticket.createdAt)}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Payment</CardTitle>
              <CardDescription>Status, account, and amount.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Payment Status</Label>
                <Select value={draftPaymentStatus} onValueChange={setDraftPaymentStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {paymentStatusOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Account</Label>
                <Select value={draftPaymentAccountId} onValueChange={(v) => { setDraftPaymentAccountId(v); setFieldErrors((prev) => ({ ...prev, paymentAccountId: "" })) }}>
                  <SelectTrigger className={fieldErrors.paymentAccountId ? "border-destructive" : ""}>
                    <SelectValue placeholder="Select account" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">—</SelectItem>
                    {accounts.map((a) => (
                      <SelectItem key={a.id} value={String(a.id)}>{a.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {fieldErrors.paymentAccountId && (
                  <p className="text-xs text-destructive mt-1">{fieldErrors.paymentAccountId}</p>
                )}
              </div>
            {draftPaymentStatus === "partially_paid" && (
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Amount Paid (Rs.)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={draftAmountPaid}
                  onChange={(e) => { setDraftAmountPaid(e.target.value); setFieldErrors((prev) => ({ ...prev, amountPaid: "" })) }}
                  className={fieldErrors.amountPaid ? "border-destructive" : ""}
                />
                {fieldErrors.amountPaid ? (
                  <p className="text-xs text-destructive mt-1">{fieldErrors.amountPaid}</p>
                ) : (
                  <p className="text-xs text-muted-foreground mt-1">
                    Remaining: Rs. {Math.max(0, computeTotal() - parseFloat(draftAmountPaid || "0")).toFixed(2)}
                  </p>
                )}
              </div>
            )}
            {draftPaymentStatus === "paid" && (
              <p className="text-xs text-muted-foreground">
                Full amount (Rs. {computeTotal().toFixed(2)}) will be applied as paid.
              </p>
            )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Status Timeline</CardTitle>
            <CardDescription>History of status changes.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {statusHistory.length === 0 ? (
                <p className="text-sm text-muted-foreground">No history recorded yet.</p>
              ) : (
                statusHistory.map((entry, index) => {
                  const labels: Record<string, string> = {
                    received: "Received",
                    diagnosing: "Diagnosing",
                    awaiting_parts: "Awaiting Parts",
                    repairing: "Repairing",
                    ready_for_pickup: "Ready for Pickup",
                    completed: "Completed",
                    cancelled: "Cancelled",
                  }
                  return (
                    <div key={entry.id} className="flex items-start gap-3">
                      <div className="flex flex-col items-center">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-primary bg-primary text-primary-foreground">
                          <div className="h-2 w-2 rounded-full bg-current" />
                        </div>
                        {index < statusHistory.length - 1 && (
                          <div className="w-0.5 h-8 bg-muted-foreground/20" />
                        )}
                      </div>
                      <div className="pt-0.5">
                        <p className="text-sm font-medium">{labels[entry.status] ?? entry.status}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(entry.changedAt).toLocaleString("en-US", {
                            month: "short",
                            day: "numeric",
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  )
                })
              )}
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
                    value={draftLaborCost}
                    onChange={(e) => { setDraftLaborCost(e.target.value); setFieldErrors((prev) => ({ ...prev, laborCost: "" })) }}
                    className={cn("h-8 w-28", fieldErrors.laborCost && "border-destructive")}
                  />
                  {fieldErrors.laborCost && (
                    <p className="text-xs text-destructive mt-1">{fieldErrors.laborCost}</p>
                  )}
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
        onPartAdded={() => {
          toast.success("Part added to ticket")
          refreshParts()
        }}
      />
      {dialog}
    </div>
  )
}
