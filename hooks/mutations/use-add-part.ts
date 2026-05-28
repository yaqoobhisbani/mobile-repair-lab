import { useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { queryKeys } from "@/lib/query-keys"

interface AddPartInput {
  ticketId: string
  inventoryId: number
  quantityUsed: number
}

export function useAddPart() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ ticketId, inventoryId, quantityUsed }: AddPartInput) =>
      api<{ item: any }>(`/api/tickets/${ticketId}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inventoryId, quantityUsed }),
      }),
    onSuccess: (_, { ticketId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tickets.detail(ticketId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory.all })
    },
  })
}
