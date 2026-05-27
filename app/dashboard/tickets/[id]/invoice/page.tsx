"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { use } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Loader2, Printer } from "lucide-react"

interface TicketData {
  id: string
  customerName: string | null
  customerPhone: string | null
  customerEmail: string | null
  brand: string
  model: string
  laborCost: string | null
  estimatedCompletion: string | null
  createdAt: string
  status: string
  problemCategory: string | null
  paymentStatus: string
  paymentAccountName: string | null
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

export default function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [ticket, setTicket] = useState<TicketData | null>(null)
  const [items, setItems] = useState<TicketItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/tickets/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setTicket(data.ticket)
        setItems(data.items)
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

  const partsTotal = items.reduce((sum, item) => {
    return sum + (parseFloat(item.sellingPrice ?? "0") * item.quantityUsed)
  }, 0)
  const labor = parseFloat(ticket.laborCost ?? "0")
  const grandTotal = partsTotal + labor

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/dashboard/tickets/${id}`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Invoice</h1>
            <p className="text-muted-foreground">Ticket {id}</p>
          </div>
        </div>
        <Button variant="outline" onClick={() => window.print()}>
          <Printer className="h-4 w-4 mr-2" />
          Print / PDF
        </Button>
      </div>

      <Card className="print:shadow-none print:border-none">
        <CardContent className="p-8 print:p-0">
          <div id="invoice-content" className="space-y-8">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-bold">Mobile Repair Lab</h2>
                <p className="text-sm text-muted-foreground">123 Repair Street</p>
                <p className="text-sm text-muted-foreground">City, State 12345</p>
                <p className="text-sm text-muted-foreground">Phone: (555) 987-6543</p>
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
                <p>{ticket.estimatedCompletion ? `Due Date: ${formatDate(ticket.estimatedCompletion)}` : ""}</p>
                <p className="mt-1">Device: {ticket.brand} {ticket.model}</p>
                <p>Ticket: {id}</p>
              </div>
            </div>

            <Separator />

            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left font-medium pb-3">Description</th>
                  <th className="text-right font-medium pb-3">Qty</th>
                  <th className="text-right font-medium pb-3">Unit Price</th>
                  <th className="text-right font-medium pb-3">Amount</th>
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
                    <td className="py-3 text-right">{item.sellingPrice ? `Rs. ${item.sellingPrice}` : "—"}</td>
                    <td className="py-3 text-right">
                      Rs. {(parseFloat(item.sellingPrice ?? "0") * item.quantityUsed).toFixed(2)}
                    </td>
                  </tr>
                ))}
                <tr className="border-b">
                  <td className="py-3">
                    <p className="font-medium">Labor / Service Fee</p>
                  </td>
                  <td className="py-3 text-right">1</td>
                  <td className="py-3 text-right">{labor > 0 ? `Rs. ${labor.toFixed(2)}` : "—"}</td>
                  <td className="py-3 text-right">{labor > 0 ? `Rs. ${labor.toFixed(2)}` : "—"}</td>
                </tr>
              </tbody>
            </table>

            <div className="flex justify-end">
              <div className="w-64 space-y-2">
                {ticket.paymentAccountName && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Account</span>
                    <span>{ticket.paymentAccountName}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>Rs. {grandTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <Separator />

            <div className="text-center text-sm text-muted-foreground">
              <p>Thank you for your business!</p>
              <p className="text-xs mt-1">Payment due upon completion. We accept Cash, Credit/Debit Card, and Mobile Wallet.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
