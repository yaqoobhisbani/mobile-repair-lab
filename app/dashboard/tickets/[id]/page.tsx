"use client"

import { useState } from "react"
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
import { ArrowLeft, Download, Edit, Plus, Trash2 } from "lucide-react"

const statusOptions = [
  { value: "received", label: "Received" },
  { value: "diagnosing", label: "Diagnosing" },
  { value: "awaiting_parts", label: "Awaiting Parts" },
  { value: "repairing", label: "Repairing" },
  { value: "ready_for_pickup", label: "Ready for Pickup" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
]

export default function TicketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [status, setStatus] = useState("repairing")
  const [isEditing, setIsEditing] = useState(false)

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
              <TicketStatusBadge status={status} />
            </div>
            <p className="text-muted-foreground">iPhone 15 Pro — Alice Johnson</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/dashboard/tickets/${id}/invoice`}>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Invoice
            </Button>
          </Link>
          <Button variant="outline" size="sm" onClick={() => setIsEditing(!isEditing)}>
            <Edit className="h-4 w-4 mr-2" />
            {isEditing ? "Done" : "Edit"}
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
                <Select value={status} onValueChange={setStatus}>
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
                <p className="text-sm font-medium">June 1, 2026</p>
              </div>
              <div>
                <Label className="text-muted-foreground text-xs">Brand</Label>
                <p className="text-sm font-medium">Apple</p>
              </div>
              <div>
                <Label className="text-muted-foreground text-xs">Model</Label>
                <p className="text-sm font-medium">iPhone 15 Pro</p>
              </div>
              <div>
                <Label className="text-muted-foreground text-xs">IMEI / Serial</Label>
                <p className="text-sm font-medium">123456789012345</p>
              </div>
              <div>
                <Label className="text-muted-foreground text-xs">Passcode</Label>
                <p className="text-sm font-medium">****</p>
              </div>
            </div>
            <Separator />
            <div>
              <Label className="text-muted-foreground text-xs">Problem Category</Label>
              <p className="text-sm font-medium">Screen</p>
            </div>
            <div>
              <Label className="text-muted-foreground text-xs">Problem Description</Label>
              <p className="text-sm text-muted-foreground">
                Customer reports cracked screen with touch responsiveness issues in the top-left corner. 
                Device has been dropped previously.
              </p>
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
              <p className="text-sm font-medium">Alice Johnson</p>
            </div>
            <div>
              <Label className="text-muted-foreground text-xs">Phone</Label>
              <p className="text-sm font-medium">+1 (555) 123-4567</p>
            </div>
            <div>
              <Label className="text-muted-foreground text-xs">Email</Label>
              <p className="text-sm font-medium">alice@example.com</p>
            </div>
            <Separator />
            <div>
              <Label className="text-muted-foreground text-xs">Created</Label>
              <p className="text-sm font-medium">May 25, 2026</p>
            </div>
            <div>
              <Label className="text-muted-foreground text-xs">Payment</Label>
              <Badge variant="secondary">Unpaid</Badge>
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
            <Button variant="outline" size="sm">
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
              <TableRow>
                <TableCell className="font-medium">iPhone 15 Pro OLED Screen</TableCell>
                <TableCell>SCR-IP15P-BLK</TableCell>
                <TableCell>1</TableCell>
                <TableCell>Rs. 199.00</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon">
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
