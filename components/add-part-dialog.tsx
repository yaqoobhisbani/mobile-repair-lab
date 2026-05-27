"use client"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Search, Loader2, Plus } from "lucide-react"

interface InventoryPart {
  id: number
  partName: string
  sku: string
  stockQty: number
  sellingPrice: string | null
}

interface AddPartDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  ticketId: string
  onPartAdded: () => void
}

export function AddPartDialog({ open, onOpenChange, ticketId, onPartAdded }: AddPartDialogProps) {
  const [parts, setParts] = useState<InventoryPart[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [selectedPart, setSelectedPart] = useState<InventoryPart | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!open) return
    setLoading(true)
    setSearch("")
    setSelectedPart(null)
    setQuantity(1)
    setError("")
    fetch("/api/inventory")
      .then((res) => res.json())
      .then((data) => setParts(data.items))
      .catch(() => setError("Failed to load inventory"))
      .finally(() => setLoading(false))
  }, [open])

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    if (!q) return parts
    return parts.filter(
      (p) =>
        p.partName.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q)
    )
  }, [search, parts])

  const handleAdd = async () => {
    if (!selectedPart) return
    setAdding(true)
    setError("")
    try {
      const res = await fetch(`/api/tickets/${ticketId}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inventoryId: selectedPart.id, quantityUsed: quantity }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Failed to add part")
        setAdding(false)
        return
      }
      onPartAdded()
      onOpenChange(false)
    } catch {
      setError("Failed to add part")
    }
    setAdding(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Part</DialogTitle>
          <DialogDescription>Select a part from inventory to add to this ticket.</DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
            Loading inventory...
          </div>
        ) : (
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by part name or SKU..."
                className="pl-9"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setSelectedPart(null)
                }}
              />
            </div>

            <div className="max-h-48 overflow-y-auto space-y-1">
              {filtered.length === 0 ? (
                <p className="text-center py-4 text-sm text-muted-foreground">No parts found.</p>
              ) : (
                filtered.map((part) => (
                  <button
                    key={part.id}
                    type="button"
                    className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm transition-colors ${
                      selectedPart?.id === part.id
                        ? "bg-accent"
                        : "hover:bg-accent/50"
                    }`}
                    onClick={() => setSelectedPart(part)}
                  >
                    <div className="flex-1 min-w-0">
                      <span className="font-medium block truncate">{part.partName}</span>
                      <span className="text-xs text-muted-foreground">{part.sku}</span>
                    </div>
                    <div className="text-right text-xs shrink-0">
                      <div>{part.sellingPrice ? `Rs. ${part.sellingPrice}` : "—"}</div>
                      <div className={part.stockQty <= 0 ? "text-destructive" : ""}>
                        Stock: {part.stockQty}
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>

            {selectedPart && (
              <div className="space-y-2 rounded-md border p-3">
                <Label htmlFor="quantity">Quantity</Label>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    disabled={quantity <= 1}
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  >
                    -
                  </Button>
                  <Input
                    id="quantity"
                    type="number"
                    min={1}
                    max={selectedPart.stockQty}
                    value={quantity}
                    onChange={(e) => {
                      const v = parseInt(e.target.value, 10)
                      if (v > 0 && v <= selectedPart.stockQty) setQuantity(v)
                    }}
                    className="h-8 w-16 text-center"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    disabled={quantity >= selectedPart.stockQty}
                    onClick={() => setQuantity(Math.min(selectedPart.stockQty, quantity + 1))}
                  >
                    +
                  </Button>
                  <span className="text-xs text-muted-foreground ml-auto">
                    Available: {selectedPart.stockQty}
                  </span>
                </div>
              </div>
            )}

            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleAdd} disabled={!selectedPart || adding || (selectedPart?.stockQty ?? 0) < 1}>
            {adding ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Adding...</>
            ) : (
              <><Plus className="h-4 w-4 mr-2" />Add to Ticket</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
