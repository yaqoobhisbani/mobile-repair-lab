"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Save, Loader2 } from "lucide-react"

export default function NewInventoryPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [formData, setFormData] = useState({
    partName: "",
    sku: "",
    compatibility: "",
    stockQty: "",
    lowStockThreshold: "",
    costPrice: "",
    sellingPrice: "",
  })

  useEffect(() => {
    if (error) toast.error(error)
  }, [error])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.id]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError("")

    try {
      const res = await fetch("/api/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Failed to create part")
        return
      }

      toast.success("Inventory item created successfully")
      router.push("/dashboard/inventory")
    } catch {
      toast.error("Failed to create inventory item")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/inventory">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">Add Inventory Part</h1>
          <p className="text-muted-foreground">Add a new spare part to the catalog.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Part Details</CardTitle>
            <CardDescription>Enter the part information and pricing.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="partName">Part Name *</Label>
                <Input id="partName" placeholder="e.g. iPhone 13 OLED Screen" value={formData.partName} onChange={handleChange} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sku">SKU / Part ID *</Label>
                <Input id="sku" placeholder="e.g. SCR-IP13-BLK" value={formData.sku} onChange={handleChange} required />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="compatibility">Device Compatibility</Label>
              <Input id="compatibility" placeholder="e.g. iPhone 13, iPhone 13 Pro" value={formData.compatibility} onChange={handleChange} />
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
                <Input id="lowStockThreshold" type="number" min="0" placeholder="e.g. 3" value={formData.lowStockThreshold} onChange={handleChange} />
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
            <Button type="button" variant="outline" disabled={saving}>Cancel</Button>
          </Link>
          <Button type="submit" disabled={saving}>
            {saving ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving...</>
            ) : (
              <><Save className="h-4 w-4 mr-2" />Add Part</>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
