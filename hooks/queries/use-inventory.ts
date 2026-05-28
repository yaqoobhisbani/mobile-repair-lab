import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { queryKeys } from "@/lib/query-keys"

export interface InventoryItem {
  id: number
  sku: string
  partName: string
  compatibility: string | null
  stockQty: number
  lowStockThreshold: number | null
  costPrice: string | null
  sellingPrice: string | null
}

export function useInventory() {
  return useQuery({
    queryKey: queryKeys.inventory.all,
    queryFn: () => api<{ items: InventoryItem[] }>("/api/inventory"),
    select: (data) => data.items,
  })
}
