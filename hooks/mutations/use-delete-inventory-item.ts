import { useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { queryKeys } from "@/lib/query-keys"

export function useDeleteInventoryItem() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) =>
      api<{ success: boolean }>(`/api/inventory/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory.all })
    },
  })
}
