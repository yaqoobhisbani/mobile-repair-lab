"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { use } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Loader2, Printer } from "lucide-react"
import { capitalize } from "@/lib/utils"

interface TicketData {
  id: string
  customerName: string | null
  customerPhone: string | null
  customerEmail: string | null
  brand: string
  model: string
  paymentStatus: string
  paymentAccountName: string | null
  paymentAccountType: string | null
  laborCost: string | null
  createdAt: string
}

interface ShopSettings {
  shopName: string
  shopAddress: string
  shopPhone: string
  currency: string
}

const paymentBadgeVariant: Record<string, "secondary" | "default" | "outline"> = {
  unpaid: "secondary",
  partially_paid: "outline",
  paid: "default",
}

interface TicketItem {
  id: number
  partName: string | null
  sku: string | null
  quantityUsed: number
  sellingPrice: string | null
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
  const [ticket, setTicket] = useState<TicketData | null>(null)
  const [items, setItems] = useState<TicketItem[]>([])
  const [loading, setLoading] = useState(true)
  const [settings, setSettings] = useState<ShopSettings | null>(null)

  useEffect(() => {
    Promise.all([
      fetch(`/api/tickets/${id}`).then((r) => r.json()),
      fetch("/api/settings").then((r) => r.json()),
    ])
      .then(([ticketData, settingsData]) => {
        setTicket(ticketData.ticket)
        setItems(ticketData.items)
        setSettings(settingsData.settings)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-muted-foreground">
        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
        Loading invoice...
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

  const s = settings ?? { shopName: "Mobile Repair Lab", shopAddress: "123 Repair Street, City, State 12345", shopPhone: "(555) 987-6543", currency: "PKR" }
  const sym = currencySymbols[s.currency] ?? "Rs."

  const [firstLine, ...restLines] = s.shopAddress.split(",").map((l: string) => l.trim())
  const addressLine1 = firstLine ?? ""
  const addressLine2 = restLines.length > 0 ? restLines.join(", ") : ""

  const partsTotal = items.reduce((sum, item) => {
    return sum + (parseFloat(item.sellingPrice ?? "0") * item.quantityUsed)
  }, 0)
  const labor = parseFloat(ticket.laborCost ?? "0")
  const grandTotal = partsTotal + labor

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
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-bold">{s.shopName}</h2>
                <p className="text-sm text-muted-foreground">{addressLine1}</p>
                {addressLine2 && <p className="text-sm text-muted-foreground">{addressLine2}</p>}
                <p className="text-sm text-muted-foreground">Phone: {s.shopPhone}</p>
              </div>
              <div className="text-right">
                <h3 className="text-lg font-semibold">Invoice</h3>
                <p className="text-sm text-muted-foreground">INV-{id}</p>
                <Badge variant={paymentBadgeVariant[ticket.paymentStatus] ?? "secondary"} className="mt-1 capitalize">
                  {ticket.paymentStatus.replace("_", " ")}
                </Badge>
              </div>
            </div>

            <Separator />

            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium mb-1">Bill To:</p>
                <p className="font-medium">{ticket.customerName}</p>
                <p className="text-sm text-muted-foreground">{ticket.customerEmail || "—"}</p>
                <p className="text-sm text-muted-foreground">{ticket.customerPhone || "—"}</p>
              </div>
              <div className="text-right text-sm text-muted-foreground">
                <p>Issue Date: {formatDate(ticket.createdAt)}</p>
                <p className="mt-1">Device: {capitalize(ticket.brand)} {ticket.model}</p>
                <p>Ticket: {id}</p>
              </div>
            </div>

            <Separator />

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
                {items.map((item) => (
                  <tr key={item.id} className="border-b">
                    <td className="py-3">
                      <p className="font-medium">{item.partName}</p>
                      <p className="text-xs text-muted-foreground">{item.sku}</p>
                    </td>
                    <td className="py-3 text-right">{item.quantityUsed}</td>
                    <td className="py-3 text-right">{item.sellingPrice ? `${sym} ${item.sellingPrice}` : "—"}</td>
                    <td className="py-3 text-right">
                      {sym} {(parseFloat(item.sellingPrice ?? "0") * item.quantityUsed).toFixed(2)}
                    </td>
                  </tr>
                ))}
                <tr className="border-b">
                  <td className="py-3">
                    <p className="font-medium">Labor / Service Fee</p>
                  </td>
                  <td className="py-3 text-right">1</td>
                  <td className="py-3 text-right">{labor > 0 ? `${sym} ${labor.toFixed(2)}` : "—"}</td>
                  <td className="py-3 text-right">{labor > 0 ? `${sym} ${labor.toFixed(2)}` : "—"}</td>
                </tr>
              </tbody>
            </table>

            <div className="flex justify-end">
              <div className="w-64 space-y-2">
                {ticket.paymentAccountName && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Payment Method</span>
                    <span>{ticket.paymentAccountType === "cash" ? "Cash" : "Bank Transfer"}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>{sym} {grandTotal.toFixed(2)}</span>
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
