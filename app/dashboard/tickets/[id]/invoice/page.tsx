"use client"

import Link from "next/link"
import { use } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Loader2, Printer } from "lucide-react"
import { PrivacyAmount } from "@/components/privacy-amount"
import { capitalize } from "@/lib/utils"
import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { queryKeys } from "@/lib/query-keys"
import { useTicket } from "@/hooks/queries/use-ticket"
import { useSettings } from "@/hooks/queries/use-settings"

interface SavedInvoice {
  id: number
  ticketId: string
  totalAmount: string
  laborCost: string | null
  discountType: string | null
  discountValue: string | null
  paymentStatus: string
  paymentMethod: string | null
  issuedAt: string
}

interface InvoiceItem {
  id: number
  partName: string
  sku: string
  unitPrice: string
  quantity: number
}

interface InvoiceTicket {
  id: string
  customerName: string | null
  customerPhone: string | null
  customerEmail: string | null
  brand: string
  model: string
  createdAt: string
}

const paymentBadgeVariant: Record<string, "secondary" | "default" | "outline"> = {
  unpaid: "secondary",
  partially_paid: "outline",
  paid: "default",
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
}

const currencySymbols: Record<string, string> = {
  PKR: "Rs.",
  USD: "$",
  EUR: "€",
  GBP: "£",
}

export default function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { data: ticketData, isLoading: ticketLoading } = useTicket(id)
  const { data: settings } = useSettings()

  const { data: savedInvoice, isLoading: invoiceLoading } = useQuery({
    queryKey: queryKeys.invoices.byTicket(id),
    queryFn: () => api<{ invoice: SavedInvoice; items: InvoiceItem[]; ticket: InvoiceTicket }>(`/api/invoices/${id}`),
    enabled: !!id,
  })

  if (ticketLoading || invoiceLoading) {
    return (
      <div className="flex items-center justify-center py-24 text-muted-foreground">
        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
        Loading invoice...
      </div>
    )
  }

  if (!ticketData?.ticket) {
    return (
      <div className="text-center py-24 text-muted-foreground">
        Ticket not found.
      </div>
    )
  }

  const s = settings ?? { shopName: "Mobile Repair Lab", shopAddress: "123 Repair Street, City, State 12345", shopPhone: "(555) 987-6543", currency: "PKR" }
  const sym = currencySymbols[s.currency] ?? "Rs."

  const [firstLine, ...restLines] = s.shopAddress.split(",").map((l: string) => l.trim())
  const addressLine1 = firstLine ?? ""
  const addressLine2 = restLines.length > 0 ? restLines.join(", ") : ""

  const isSnapshot = !!savedInvoice

  const displayItems = isSnapshot
    ? savedInvoice.items.map((item) => ({
        id: item.id,
        partName: item.partName,
        sku: item.sku,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      }))
    : ticketData.items.map((item) => ({
        id: item.id,
        partName: item.partName ?? "",
        sku: item.sku ?? "",
        quantity: item.quantityUsed,
        unitPrice: item.sellingPrice ?? "0",
      }))

  const displayTicket = isSnapshot
    ? {
        customerName: savedInvoice.ticket.customerName,
        customerEmail: savedInvoice.ticket.customerEmail,
        customerPhone: savedInvoice.ticket.customerPhone,
        brand: savedInvoice.ticket.brand,
        model: savedInvoice.ticket.model,
        createdAt: savedInvoice.ticket.createdAt,
        paymentStatus: savedInvoice.invoice.paymentStatus,
        paymentMethod: savedInvoice.invoice.paymentMethod,
        laborCost: savedInvoice.invoice.laborCost,
        discountType: savedInvoice.invoice.discountType,
        discountValue: savedInvoice.invoice.discountValue,
      }
    : {
        customerName: ticketData.ticket.customerName,
        customerEmail: ticketData.ticket.customerEmail,
        customerPhone: ticketData.ticket.customerPhone,
        brand: ticketData.ticket.brand,
        model: ticketData.ticket.model,
        createdAt: ticketData.ticket.createdAt,
        paymentStatus: ticketData.ticket.paymentStatus,
        paymentMethod: null,
        laborCost: ticketData.ticket.laborCost,
        discountType: ticketData.ticket.discountType,
        discountValue: ticketData.ticket.discountValue,
      }

  const partsTotal = displayItems.reduce((sum, item) => {
    return sum + (parseFloat(item.unitPrice) * item.quantity)
  }, 0)
  const labor = parseFloat(displayTicket.laborCost ?? "0")
  const subtotal = partsTotal + labor
  let discountAmount = 0
  if (displayTicket.discountType === "percentage" && displayTicket.discountValue) {
    discountAmount = subtotal * parseFloat(displayTicket.discountValue) / 100
  } else if (displayTicket.discountType === "amount" && displayTicket.discountValue) {
    discountAmount = parseFloat(displayTicket.discountValue)
  }
  const grandTotal = Math.max(0, subtotal - discountAmount)

  const paymentMethodLabel =
    displayTicket.paymentMethod === "cash" ? "Cash"
    : displayTicket.paymentMethod === "card" ? "Card"
    : displayTicket.paymentMethod === "mobile_wallet" ? "Mobile Wallet"
    : null

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between print:hidden">
        <div className="flex items-center gap-4">
          <Link href={`/dashboard/tickets/${id}`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-600 to-teal-600 bg-clip-text text-transparent">Invoice</h1>
            <p className="text-muted-foreground">Ticket {id}</p>
          </div>
        </div>
        <Button variant="secondary" onClick={() => window.print()} className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700">
          <Printer className="h-4 w-4 mr-2" />
          Print / PDF
        </Button>
      </div>

      <Card className="print:shadow-none print:border-none print:bg-transparent">
        <CardContent className="p-8 print:p-0">
          <div id="invoice-content" className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold">{s.shopName}</h2>
                <p className="text-sm text-muted-foreground">{addressLine1}</p>
                {addressLine2 && <p className="text-sm text-muted-foreground">{addressLine2}</p>}
                <p className="text-sm text-muted-foreground">Phone: {s.shopPhone}</p>
              </div>
              <div className="text-left sm:text-right">
                <h3 className="text-lg font-semibold">Invoice</h3>
                <p className="text-sm text-muted-foreground">INV-{id}</p>
                <Badge variant={paymentBadgeVariant[displayTicket.paymentStatus] ?? "secondary"} className="mt-1 capitalize">
                  {displayTicket.paymentStatus.replace("_", " ")}
                </Badge>
              </div>
            </div>

            <Separator />

            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div>
                <p className="text-sm font-medium mb-1">Bill To:</p>
                <p className="font-medium">{displayTicket.customerName}</p>
                <p className="text-sm text-muted-foreground">{displayTicket.customerEmail || "—"}</p>
                <p className="text-sm text-muted-foreground">{displayTicket.customerPhone || "—"}</p>
              </div>
              <div className="text-left sm:text-right text-sm text-muted-foreground">
                <p>Issue Date: {formatDate(displayTicket.createdAt)}</p>
                <p className="mt-1">Device: {capitalize(displayTicket.brand)} {displayTicket.model}</p>
                <p>Ticket: {id}</p>
              </div>
            </div>

            <Separator />

            <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left pb-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Description</th>
                  <th className="text-right pb-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Qty</th>
                  <th className="text-right pb-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Unit Price</th>
                  <th className="text-right pb-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Amount</th>
                </tr>
              </thead>
              <tbody>
                {displayItems.map((item) => (
                  <tr key={item.id} className="border-b">
                    <td className="py-3">
                      <p className="font-medium">{item.partName}</p>
                      <p className="text-xs text-muted-foreground">{item.sku}</p>
                    </td>
                    <td className="py-3 text-right">{item.quantity}</td>
                    <td className="py-3 text-right">{item.unitPrice ? <PrivacyAmount>{sym} {item.unitPrice}</PrivacyAmount> : "—"}</td>
                    <td className="py-3 text-right">
                      <PrivacyAmount>{sym} {(parseFloat(item.unitPrice) * item.quantity).toFixed(2)}</PrivacyAmount>
                    </td>
                  </tr>
                ))}
                <tr className="border-b">
                  <td className="py-3">
                    <p className="font-medium">Labor / Service Fee</p>
                  </td>
                  <td className="py-3 text-right">1</td>
                  <td className="py-3 text-right">{labor > 0 ? <PrivacyAmount>{sym} {labor.toFixed(2)}</PrivacyAmount> : "—"}</td>
                  <td className="py-3 text-right">{labor > 0 ? <PrivacyAmount>{sym} {labor.toFixed(2)}</PrivacyAmount> : "—"}</td>
                </tr>
              </tbody>
            </table>
            </div>

            <div className="flex justify-end">
              <div className="w-full sm:w-64 space-y-2">
                {paymentMethodLabel && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Payment Method</span>
                    <span>{paymentMethodLabel}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span><PrivacyAmount>{sym} {subtotal.toFixed(2)}</PrivacyAmount></span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Discount</span>
                    <span>- <PrivacyAmount>{sym} {discountAmount.toFixed(2)}</PrivacyAmount></span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-lg pt-1 border-t">
                  <span>Total</span>
                  <span><PrivacyAmount>{sym} {grandTotal.toFixed(2)}</PrivacyAmount></span>
                </div>
              </div>
            </div>

            <Separator />

            <div className="text-center text-sm text-muted-foreground">
              <p>Thank you for your business!</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
