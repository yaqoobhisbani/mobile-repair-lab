"use client"

import { useState, useEffect, useCallback, useRef } from "react"
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
import { PrivacyAmount } from "@/components/privacy-amount"
import { capitalize } from "@/lib/utils"
import { toast } from "sonner"
import { useConfirm } from "@/hooks/use-confirm"
import { cn } from "@/lib/utils"
import { useTicket } from "@/hooks/queries/use-ticket"
import { useAccounts } from "@/hooks/queries/use-accounts"
import { useUpdateTicket } from "@/hooks/mutations/use-update-ticket"
import { useRemovePart } from "@/hooks/mutations/use-remove-part"

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
  const { data, isLoading, isError } = useTicket(id)
  const { data: accounts = [], isLoading: accountsLoading } = useAccounts()
  const updateTicket = useUpdateTicket()
  const removePartMutation = useRemovePart()

  const [saving, setSaving] = useState(false)
  const [showAddPart, setShowAddPart] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const [draftStatus, setDraftStatus] = useState("")
  const [draftPaymentStatus, setDraftPaymentStatus] = useState("")
  const [draftPaymentAccountId, setDraftPaymentAccountId] = useState<string>("none")
  const [draftLaborCost, setDraftLaborCost] = useState("")
  const [draftDiscountType, setDraftDiscountType] = useState<string>("none")
  const [draftDiscountValue, setDraftDiscountValue] = useState("")
  const [draftAmountPaid, setDraftAmountPaid] = useState("")
  const [draftImei, setDraftImei] = useState("")
  const [draftPasscode, setDraftPasscode] = useState("")
  const [draftDescription, setDraftDescription] = useState("")
  const { confirm, dialog } = useConfirm()

  const ticket = data?.ticket ?? null
  const items = data?.items ?? []
  const statusHistory = data?.statusHistory ?? []

  const initialized = useRef(false)

  useEffect(() => {
    if (data && !initialized.current) {
      initialized.current = true
      setDraftStatus(data.ticket.status)
      setDraftPaymentStatus(data.ticket.paymentStatus)
      setDraftPaymentAccountId(data.ticket.paymentAccountId ? String(data.ticket.paymentAccountId) : "none")
      setDraftLaborCost(data.ticket.laborCost ?? "")
      setDraftDiscountType(data.ticket.discountType ?? "none")
      setDraftDiscountValue(data.ticket.discountValue ?? "")
      setDraftAmountPaid(data.ticket.amountPaid ?? "0")
      setDraftImei(data.ticket.imei ?? "")
      setDraftPasscode(data.ticket.passcode ?? "")
      setDraftDescription(data.ticket.problemDescription ?? "")
    }
  }, [data])

  const computeTotal = useCallback(() => {
    const partsSum = items.reduce(
      (sum, item) => sum + (parseFloat(item.sellingPrice ?? "0") * item.quantityUsed),
      0
    )
    const subtotal = partsSum + parseFloat(draftLaborCost || "0")
    let discountAmount = 0
    if (draftDiscountType === "percentage" && draftDiscountValue) {
      discountAmount = subtotal * parseFloat(draftDiscountValue) / 100
    } else if (draftDiscountType === "amount" && draftDiscountValue) {
      discountAmount = parseFloat(draftDiscountValue)
    }
    return Math.max(0, subtotal - discountAmount)
  }, [items, draftLaborCost, draftDiscountType, draftDiscountValue])

  const hasChanges = ticket && (
    draftStatus !== ticket.status ||
    draftPaymentStatus !== ticket.paymentStatus ||
    draftPaymentAccountId !== (ticket.paymentAccountId ? String(ticket.paymentAccountId) : "none") ||
    draftLaborCost !== (ticket.laborCost ?? "") ||
    draftDiscountType !== (ticket.discountType ?? "none") ||
    draftDiscountValue !== (ticket.discountValue ?? "") ||
    draftAmountPaid !== (ticket.amountPaid ?? "0") ||
    draftImei !== (ticket.imei ?? "") ||
    draftPasscode !== (ticket.passcode ?? "") ||
    draftDescription !== (ticket.problemDescription ?? "")
  )

  const handleSave = () => {
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
        errors.amountPaid = `Amount paid (Rs. ...) exceeds total (Rs. ...)`
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

    const body: Record<string, any> = {
      status: draftStatus,
      paymentStatus: draftPaymentStatus,
      paymentAccountId: draftPaymentAccountId === "none" ? null : Number(draftPaymentAccountId),
      laborCost: draftLaborCost || null,
      discountType: draftDiscountType !== "none" ? draftDiscountType : null,
      discountValue: draftDiscountValue || null,
      imei: draftImei || null,
      passcode: draftPasscode || null,
      problemDescription: draftDescription || null,
    }
    if (draftPaymentStatus === "partially_paid") {
      body.amountPaid = draftAmountPaid || "0"
    }

    updateTicket.mutate(
      { id, ...body },
      {
        onSuccess: () => {
          toast.success("Ticket updated successfully")
        },
        onError: () => {
          setFieldErrors({ form: "Failed to save changes" })
        },
        onSettled: () => {
          setSaving(false)
        },
      }
    )
  }

  const removePart = async (itemId: number) => {
    const ok = await confirm({ title: "Remove Part", description: "Remove this part from the ticket? Stock will be restored.", variant: "destructive" })
    if (!ok) return
    removePartMutation.mutate(
      { ticketId: id, itemId },
      {
        onSuccess: () => {
          toast.success("Part removed from ticket")
        },
      }
    )
  }

  const loading = isLoading || accountsLoading

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-muted-foreground">
        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
        Loading ticket...
      </div>
    )
  }

  if (isError || !ticket) {
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
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 min-w-0">
            <Link href="/dashboard/tickets">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="min-w-0">
              <div className="flex items-center gap-3">
                <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-cyan-600 to-teal-600 bg-clip-text text-transparent truncate">Ticket {id}</h1>
                <TicketStatusBadge status={draftStatus} />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link href={`/dashboard/tickets/${id}/invoice`}>
              <Button variant="secondary" size="sm" className="bg-card text-gray-700 hover:bg-accent hover:text-accent-foreground border dark:text-gray-200 dark:hover:bg-accent dark:hover:text-accent-foreground">
                <Download className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Invoice</span>
              </Button>
            </Link>
            <Button onClick={handleSave} disabled={saving || !hasChanges} size="sm">
              {saving ? (
                <><Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-2 animate-spin" /><span className="hidden sm:inline">Saving...</span></>
              ) : (
                <><Save className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-2" /><span className="hidden sm:inline">Save Changes</span></>
              )}
            </Button>
          </div>
        </div>
        <p className="text-muted-foreground text-sm">{capitalize(ticket.brand)} {ticket.model} {ticket.customerName}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        <Card className="lg:col-span-2">
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

        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle>Customer</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
            <span className="text-muted-foreground">Name</span>
            <span className="font-medium">{ticket.customerName}</span>
            <span className="text-muted-foreground">Phone</span>
            <span>{ticket.customerPhone || "—"}</span>
            <span className="text-muted-foreground">Email</span>
            <span>{ticket.customerEmail || "—"}</span>
            <span className="text-muted-foreground">Created</span>
            <span>{formatDate(ticket.createdAt)}</span>
          </CardContent>
        </Card>

        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle>Status Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
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
                    <div key={entry.id} className="flex items-start gap-2">
                      <div className="flex flex-col items-center">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-primary bg-primary text-primary-foreground">
                          <div className="h-2 w-2 rounded-full bg-current" />
                        </div>
                        {index < statusHistory.length - 1 && (
                          <div className="w-0.5 h-6 bg-muted-foreground/20" />
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

      <div className="grid gap-6 lg:grid-cols-[7fr_3fr]">
        <Card className="min-w-0">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Parts Used</CardTitle>
                <CardDescription>Inventory items attached to this ticket.</CardDescription>
              </div>
              <Button variant="secondary" size="sm" className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700" onClick={() => setShowAddPart(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Part
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
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
                      <TableCell className="font-medium whitespace-nowrap">{item.partName}</TableCell>
                      <TableCell className="whitespace-nowrap">{item.sku}</TableCell>
                      <TableCell>{item.quantityUsed}</TableCell>
                      <TableCell className="whitespace-nowrap">{item.sellingPrice ? <PrivacyAmount>Rs. {item.sellingPrice}</PrivacyAmount> : "—"}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => removePart(item.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
                <TableRow>
                  <TableCell className="font-medium whitespace-nowrap">Labor / Service Fee</TableCell>
                  <TableCell>—</TableCell>
                  <TableCell>1</TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={draftLaborCost}
                      onChange={(e) => { setDraftLaborCost(e.target.value); setFieldErrors((prev) => ({ ...prev, laborCost: "" })) }}
                      className={cn("h-8 w-20 sm:w-28", fieldErrors.laborCost && "border-destructive")}
                    />
                    {fieldErrors.laborCost && (
                      <p className="text-xs text-destructive mt-1">{fieldErrors.laborCost}</p>
                    )}
                  </TableCell>
                  <TableCell className="text-right" />
                </TableRow>
              </TableBody>
            </Table>
            </div>
          </CardContent>
        </Card>

        <Card className="min-w-0">
          <CardHeader className="pb-3">
            <CardTitle>Payment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
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

            <Separator />

            <div>
              <Label className="text-sm font-medium text-muted-foreground">Discount Type</Label>
              <Select value={draftDiscountType} onValueChange={(v) => { setDraftDiscountType(v); setDraftDiscountValue("") }}>
                <SelectTrigger>
                  <SelectValue placeholder="No discount" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="percentage">Percentage (%)</SelectItem>
                  <SelectItem value="amount">Amount (Rs.)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {draftDiscountType !== "none" && (
              <div>
                <Label className="text-sm font-medium text-muted-foreground">
                  {draftDiscountType === "percentage" ? "Discount %" : "Discount Amount (Rs.)"}
                </Label>
                <Input
                  type="number"
                  min="0"
                  step={draftDiscountType === "percentage" ? "1" : "0.01"}
                  placeholder={draftDiscountType === "percentage" ? "10" : "100"}
                  value={draftDiscountValue}
                  onChange={(e) => setDraftDiscountValue(e.target.value)}
                />
              </div>
            )}

            <div className="rounded-lg bg-gradient-to-r from-cyan-50 to-teal-50 dark:from-cyan-950/30 dark:to-teal-950/30 p-3">
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span>Subtotal</span>
                  <span>Rs. {(items.reduce((s, i) => s + parseFloat(i.sellingPrice ?? "0") * i.quantityUsed, 0) + parseFloat(draftLaborCost || "0")).toFixed(2)}</span>
                </div>
                {draftDiscountType !== "none" && draftDiscountValue && (
                  <div className="flex items-center justify-between text-xs text-green-600">
                    <span>Discount</span>
                    <span>- Rs. {(() => { const s = items.reduce((sum, i) => sum + parseFloat(i.sellingPrice ?? "0") * i.quantityUsed, 0) + parseFloat(draftLaborCost || "0"); const dv = parseFloat(draftDiscountValue); return (draftDiscountType === "percentage" ? s * dv / 100 : dv).toFixed(2) })()}</span>
                  </div>
                )}
                <div className="flex items-center justify-between pt-1 border-t">
                  <span className="text-xs font-semibold">Total</span>
                  <span className="text-base font-bold bg-gradient-to-r from-cyan-600 to-teal-600 bg-clip-text text-transparent">Rs. {computeTotal().toFixed(2)}</span>
                </div>
              </div>
            </div>

            {(draftPaymentStatus === "partially_paid" || draftPaymentStatus === "paid") && (
              <div>
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
                        Remaining: <PrivacyAmount as="span">Rs. {Math.max(0, computeTotal() - parseFloat(draftAmountPaid || "0")).toFixed(2)}</PrivacyAmount>
                      </p>
                    )}
                  </div>
                )}
                {draftPaymentStatus === "paid" && (
                  <div className="rounded-md bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 p-3 text-sm text-emerald-700 dark:text-emerald-400">
                    Full amount (<PrivacyAmount as="span">Rs. {computeTotal().toFixed(2)}</PrivacyAmount>) will be applied as paid.
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <AddPartDialog
        open={showAddPart}
        onOpenChange={setShowAddPart}
        ticketId={id}
        onPartAdded={() => {
          toast.success("Part added to ticket")
        }}
      />
      {dialog}
    </div>
  )
}
