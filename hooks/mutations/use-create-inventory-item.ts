import { useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { queryKeys } from "@/lib/query-keys"

interface CreateInventoryInput {
  partName: string
  sku: string
  compatibility?: string
  stockQty?: number
  lowStockThreshold?: number
  costPrice?: number
  sellingPrice?: number
}

export function useCreateInventoryItem() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateInventoryInput) =>
      api<{ item: any }>("/api/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory.all })
    },
  })
}
