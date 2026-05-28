"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Loader2, Save, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { useConfirm } from "@/hooks/use-confirm"
import { useInventoryItem } from "@/hooks/queries/use-inventory-item"
import { useUpdateInventoryItem } from "@/hooks/mutations/use-update-inventory-item"
import { useDeleteInventoryItem } from "@/hooks/mutations/use-delete-inventory-item"

interface EditInventoryFormProps {
  itemId: number
  onSuccess: () => void
  onCancel: () => void
}

export function EditInventoryForm({ itemId, onSuccess, onCancel }: EditInventoryFormProps) {
  const { confirm, dialog } = useConfirm()
  const { data: item, isLoading } = useInventoryItem(itemId)
  const updateInventoryItem = useUpdateInventoryItem()
  const deleteInventoryItem = useDeleteInventoryItem()

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
    if (item) {
      setFormData({
        partName: item.partName,
        sku: item.sku,
        compatibility: item.compatibility ?? "",
        stockQty: String(item.stockQty),
        lowStockThreshold: item.lowStockThreshold !== null ? String(item.lowStockThreshold) : "",
        costPrice: item.costPrice ?? "",
        sellingPrice: item.sellingPrice ?? "",
      })
    }
  }, [item])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.id]: e.target.value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    updateInventoryItem.mutate(
      {
        id: itemId,
        partName: formData.partName,
        compatibility: formData.compatibility || null,
        stockQty: formData.stockQty ? Number(formData.stockQty) : undefined,
        lowStockThreshold: formData.lowStockThreshold ? Number(formData.lowStockThreshold) : null,
        costPrice: formData.costPrice ? Number(formData.costPrice) : null,
        sellingPrice: formData.sellingPrice ? Number(formData.sellingPrice) : null,
      },
      {
        onSuccess: () => {
          toast.success("Inventory item updated successfully")
          onSuccess()
        },
        onError: () => {
          toast.error("Failed to update inventory item")
          setSaving(false)
        },
        onSettled: () => {
          setSaving(false)
        },
      }
    )
  }

  const handleDelete = async () => {
    const ok = await confirm({ title: "Delete part", description: `Delete "${formData.partName}"? This cannot be undone.`, variant: "destructive" })
    if (!ok) return
    deleteInventoryItem.mutate(itemId, {
      onSuccess: () => {
        toast.success("Item deleted successfully")
        onSuccess()
      },
    })
  }

  if (isLoading) {
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