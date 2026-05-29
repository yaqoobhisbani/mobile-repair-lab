import { useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { queryKeys } from "@/lib/query-keys"

export interface UpdateInventoryInput {
  id: number
  partName?: string
  compatibility?: string | null
  stockQty?: number
  lowStockThreshold?: number | null
  costPrice?: number | null
  sellingPrice?: number | null
  accountId?: number | null
}

export function useUpdateInventoryItem() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: UpdateInventoryInput) =>
      api<{ item: any }>(`/api/inventory/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory.detail(id) })
      queryClient.invalidateQueries({ queryKey: queryKeys.accounts.all })
    },
  })
}
