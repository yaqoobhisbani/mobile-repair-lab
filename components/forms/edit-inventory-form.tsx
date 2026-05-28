"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Loader2, Save, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { useConfirm } from "@/hooks/use-confirm"

interface EditInventoryFormProps {
  itemId: number
  onSuccess: () => void
  onCancel: () => void
}

export function EditInventoryForm({ itemId, onSuccess, onCancel }: EditInventoryFormProps) {
  const { confirm, dialog } = useConfirm()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
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
    fetch(`/api/inventory/${itemId}`)
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
      .catch(() => toast.error("Failed to load part"))
      .finally(() => setLoading(false))
  }, [itemId])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.id]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const res = await fetch(`/api/inventory/${itemId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (!res.ok) {
        const data = await res.json()
        toast.error(data.error || "Failed to update part")
        setSaving(false)
        return
      }

      toast.success("Inventory item updated successfully")
      onSuccess()
    } catch {
      toast.error("Failed to update inventory item")
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    const ok = await confirm({ title: "Delete part", description: `Delete "${formData.partName}"? This cannot be undone.`, variant: "destructive" })
    if (!ok) return
    try {
      const res = await fetch(`/api/inventory/${itemId}`, { method: "DELETE" })
      if (res.ok) {
        toast.success("Item deleted successfully")
        onSuccess()
      }
    } catch {}
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
        Loading part...
      </div>
    )
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4">
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

        <div className="grid gap-4 sm:grid-cols-2">
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

        <div className="flex items-center justify-between pt-4 border-t">
          <Button type="button" variant="destructive" size="sm" onClick={handleDelete}>
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
          <div className="flex items-center gap-3">
            <Button type="button" variant="outline" disabled={saving} onClick={onCancel}>Cancel</Button>
            <Button type="submit" disabled={saving}>
              {saving ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving...</>
              ) : (
                <><Save className="h-4 w-4 mr-2" />Save Changes</>
              )}
            </Button>
          </div>
        </div>
      </form>
      {dialog}
    </>
  )
}
