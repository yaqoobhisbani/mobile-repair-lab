"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Loader2, Save } from "lucide-react"
import { toast } from "sonner"
import { useCreateInventoryItem } from "@/hooks/mutations/use-create-inventory-item"

interface CreateInventoryFormProps {
  onSuccess: () => void
  onCancel: () => void
}

export function CreateInventoryForm({ onSuccess, onCancel }: CreateInventoryFormProps) {
  const createInventoryItem = useCreateInventoryItem()
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.id]: e.target.value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    createInventoryItem.mutate(
      {
        partName: formData.partName,
        sku: formData.sku,
        compatibility: formData.compatibility || undefined,
        stockQty: formData.stockQty ? Number(formData.stockQty) : undefined,
        lowStockThreshold: formData.lowStockThreshold ? Number(formData.lowStockThreshold) : undefined,
        costPrice: formData.costPrice ? Number(formData.costPrice) : undefined,
        sellingPrice: formData.sellingPrice ? Number(formData.sellingPrice) : undefined,
      },
      {
        onSuccess: () => {
          toast.success("Inventory item created successfully")
          onSuccess()
        },
        onError: () => {
          toast.error("Failed to create inventory item")
          setSaving(false)
        },
        onSettled: () => {
          setSaving(false)
        },
      }
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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

      <div className="grid gap-4 sm:grid-cols-2">
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

      <div className="flex items-center justify-end gap-3 pt-4 border-t">
        <Button type="button" variant="outline" disabled={saving} onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={saving}>
          {saving ? (
            <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving...</>
          ) : (
            <><Save className="h-4 w-4 mr-2" />Add Part</>
          )}
        </Button>
      </div>
    </form>
  )
}