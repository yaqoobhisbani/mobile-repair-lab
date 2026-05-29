"use client"

import Link from "next/link"
import { use } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Loader2, Printer } from "lucide-react"
import { useSale } from "@/hooks/queries/use-sale"
import { useSettings } from "@/hooks/queries/use-settings"

function formatDate(d: string) {
  const dt = new Date(d)
  return `${String(dt.getDate()).padStart(2, "0")}/${String(dt.getMonth() + 1).padStart(2, "0")}/${dt.getFullYear()}`
}

function formatDateTime(d: string) {
  const dt = new Date(d)
  const date = `${String(dt.getDate()).padStart(2, "0")}/${String(dt.getMonth() + 1).padStart(2, "0")}/${dt.getFullYear()}`
  const time = dt.toLocaleString("en-US", { hour: "numeric", minute: "2-digit" })
  return `${date} ${time}`
}

const currencySymbols: Record<string, string> = {
  PKR: "Rs.",
  USD: "$",
  EUR: "\u20AC",
  GBP: "\u00A3",
}

export default function SaleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { data: saleData, isLoading: saleLoading } = useSale(id)
  const { data: settings } = useSettings()

  if (saleLoading) {
    return (
      <div className="flex items-center justify-center py-24 text-muted-foreground">
        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
        Loading sale...
      </div>
    )
  }

  if (!saleData?.sale) {
    return (
      <div className="text-center py-24 text-muted-foreground">
        Sale not found.
      </div>
    )
  }

  const { sale, items } = saleData
  const s = settings ?? { shopName: "Mobile Repair Lab", shopAddress: "123 Repair Street, City, State 12345", shopPhone: "(555) 987-6543", currency: "PKR" }
  const sym = currencySymbols[s.currency] ?? "Rs."

  const [firstLine, ...restLines] = s.shopAddress.split(",").map((l: string) => l.trim())
  const addressLine1 = firstLine ?? ""
  const addressLine2 = restLines.length > 0 ? restLines.join(", ") : ""

  const totalAmount = parseFloat(sale.totalAmount)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between print:hidden">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/sales">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-rose-600 bg-clip-text text-transparent">Sale Receipt</h1>
            <p className="text-muted-foreground">{sale.id}</p>
          </div>
        </div>
        <Button variant="secondary" onClick={() => window.print()} className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700">
          <Printer className="h-4 w-4 mr-2" />
          Print / PDF
        </Button>
      </div>

      <Card className="print:shadow-none print:border-none print:bg-transparent">
        <CardContent className="p-8 print:p-0">
          <div id="receipt-content" className="space-y-8">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-bold">{s.shopName}</h2>
                <p className="text-sm text-muted-foreground">{addressLine1}</p>
                {addressLine2 && <p className="text-sm text-muted-foreground">{addressLine2}</p>}
                <p className="text-sm text-muted-foreground">Phone: {s.shopPhone}</p>
              </div>
              <div className="text-right">
                <h3 className="text-lg font-semibold">Receipt</h3>
                <p className="text-sm text-muted-foreground">{sale.id}</p>
              </div>
            </div>

            <Separator />

            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium mb-1">Sold To:</p>
                <p className="font-medium">{sale.customerName || "Walk-in Customer"}</p>
                {sale.customerPhone && (
                  <p className="text-sm text-muted-foreground">{sale.customerPhone}</p>
                )}
              </div>
              <div className="text-right text-sm text-muted-foreground">
                <p>Date: {formatDateTime(sale.createdAt)}</p>
                <p className="mt-1">Account: {sale.paymentAccountName || "\u2014"}</p>
                <p>Type: {sale.paymentAccountType === "cash" ? "Cash" : "Bank Transfer"}</p>
              </div>
            </div>

            <Separator />

            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left pb-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Item</th>
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
                    <td className="py-3 text-right">{item.quantity}</td>
                    <td className="py-3 text-right">{sym} {parseFloat(item.unitPrice).toFixed(2)}</td>
                    <td className="py-3 text-right">
                      {sym} {(parseFloat(item.unitPrice) * item.quantity).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="flex justify-end">
              <div className="w-64 space-y-2">
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>{sym} {totalAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <Separator />

            <div className="text-center text-sm text-muted-foreground">
              <p>Thank you for your purchase!</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
