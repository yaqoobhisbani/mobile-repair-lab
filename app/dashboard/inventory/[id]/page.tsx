"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { use } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Save, Trash2, Loader2 } from "lucide-react"

interface FormData {
  partName: string
  sku: string
  compatibility: string
  stockQty: string
  lowStockThreshold: string
  costPrice: string
  sellingPrice: string
}

export default function EditInventoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [formData, setFormData] = useState<FormData>({
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

  useEffect(() => {
    fetch(`/api/inventory/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Not found")
        return res.json()
      })
      .then((data) => {
        const item = data.item
        setFormData({
          partName: item.partName,
          sku: item.sku,
          compatibility: item.compatibility ?? "",
          stockQty: String(item.stockQty),
          lowStockThreshold: item.lowStockThreshold !== null ? String(item.lowStockThreshold) : "",
          costPrice: item.costPrice ?? "",
          sellingPrice: item.sellingPrice ?? "",
        })
      })
      .catch(() => setError("Part not found"))
      .finally(() => setLoading(false))
  }, [id])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.id]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError("")

    try {
      const res = await fetch(`/api/inventory/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || "Failed to update part")
        return
      }

      toast.success("Inventory item updated successfully")
      router.push("/dashboard/inventory")
    } catch {
      toast.error("Failed to update inventory item")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this part? This action cannot be undone.")) return

    setSaving(true)
    try {
      const res = await fetch(`/api/inventory/${id}`, { method: "DELETE" })
      if (res.ok) {
        router.push("/dashboard/inventory")
      } else {
        const data = await res.json()
        setError(data.error || "Failed to delete part")
      }
    } catch {
      setError("Failed to delete part")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
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
            <h1 className="text-2xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">Edit Part</h1>
            <p className="text-muted-foreground">SKU: {formData.sku}</p>
          </div>
        </div>
        <Button variant="destructive" size="sm" onClick={handleDelete} disabled={saving}>
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
            <Button type="button" variant="outline" disabled={saving}>Cancel</Button>
          </Link>
          <Button type="submit" disabled={saving}>
            {saving ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving...</>
            ) : (
              <><Save className="h-4 w-4 mr-2" />Save Changes</>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
