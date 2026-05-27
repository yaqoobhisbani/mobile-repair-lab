"use client"

import Link from "next/link"
import { use } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Printer } from "lucide-react"

export default function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)

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
                <Badge variant="secondary" className="mt-1">Unpaid</Badge>
              </div>
            </div>

            <Separator />

            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium mb-1">Bill To:</p>
                <p className="font-medium">Alice Johnson</p>
                <p className="text-sm text-muted-foreground">alice@example.com</p>
                <p className="text-sm text-muted-foreground">+1 (555) 123-4567</p>
              </div>
              <div className="text-right text-sm text-muted-foreground">
                <p>Issue Date: May 25, 2026</p>
                <p>Due Date: June 1, 2026</p>
                <p className="mt-1">Device: iPhone 15 Pro</p>
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
                <tr className="border-b">
                  <td className="py-3">
                    <p className="font-medium">iPhone 15 Pro OLED Screen</p>
                    <p className="text-xs text-muted-foreground">SCR-IP15P-BLK</p>
                  </td>
                  <td className="py-3 text-right">1</td>
                  <td className="py-3 text-right">Rs. 199.00</td>
                  <td className="py-3 text-right">Rs. 199.00</td>
                </tr>
                <tr className="border-b">
                  <td className="py-3">
                    <p className="font-medium">Labor / Service Fee</p>
                    <p className="text-xs text-muted-foreground">Screen replacement labor</p>
                  </td>
                  <td className="py-3 text-right">1</td>
                  <td className="py-3 text-right">Rs. 50.00</td>
                  <td className="py-3 text-right">Rs. 50.00</td>
                </tr>
              </tbody>
            </table>

            <div className="flex justify-end">
              <div className="w-64 space-y-2">
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>Rs. 249.00</span>
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
