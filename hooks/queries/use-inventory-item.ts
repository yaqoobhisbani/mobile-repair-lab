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

export function useInventoryItem(id: number) {
  return useQuery({
    queryKey: queryKeys.inventory.detail(id),
    queryFn: () => api<{ item: InventoryItem }>(`/api/inventory/${id}`),
    select: (data) => data.item,
    enabled: !!id,
  })
}
