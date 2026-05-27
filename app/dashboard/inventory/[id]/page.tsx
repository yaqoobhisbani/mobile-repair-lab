"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { use } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Save, Trash2 } from "lucide-react"

export default function EditInventoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [formData, setFormData] = useState({
    partName: "iPhone 15 Pro OLED Screen",
    sku: id,
    compatibility: "iPhone 15 Pro",
    stockQty: "8",
    lowStockThreshold: "3",
    costPrice: "120.00",
    sellingPrice: "199.00",
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.id]: e.target.value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    router.push("/dashboard/inventory")
  }

  const handleDelete = () => {
    router.push("/dashboard/inventory")
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/inventory">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Edit Part</h1>
            <p className="text-muted-foreground">SKU: {id}</p>
          </div>
        </div>
        <Button variant="destructive" size="sm" onClick={handleDelete}>
          <Trash2 className="h-4 w-4 mr-2" />
          Delete
        </Button>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Part Details</CardTitle>
            <CardDescription>Update the part information and pricing.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="partName">Part Name *</Label>
                <Input id="partName" value={formData.partName} onChange={handleChange} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sku">SKU / Part ID</Label>
                <Input id="sku" value={formData.sku} disabled className="bg-muted" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="compatibility">Device Compatibility</Label>
              <Input id="compatibility" value={formData.compatibility} onChange={handleChange} />
            </div>

            <Separator />

            <p className="text-sm font-medium">Stock &amp; Pricing</p>

            <div className="grid gap-4 sm:grid-cols-4">
              <div className="space-y-2">
                <Label htmlFor="stockQty">Stock Quantity *</Label>
                <Input id="stockQty" type="number" min="0" value={formData.stockQty} onChange={handleChange} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lowStockThreshold">Low Stock Alert</Label>
                <Input id="lowStockThreshold" type="number" min="0" value={formData.lowStockThreshold} onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="costPrice">Cost Price (Rs.)</Label>
                <Input id="costPrice" type="number" min="0" step="0.01" value={formData.costPrice} onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sellingPrice">Selling Price (Rs.)</Label>
                <Input id="sellingPrice" type="number" min="0" step="0.01" value={formData.sellingPrice} onChange={handleChange} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Separator className="my-6" />

        <div className="flex items-center justify-end gap-4">
          <Link href="/dashboard/inventory">
            <Button type="button" variant="outline">Cancel</Button>
          </Link>
          <Button type="submit">
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  )
}
