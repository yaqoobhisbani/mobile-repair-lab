import { useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { queryKeys } from "@/lib/query-keys"

interface RemovePartInput {
  ticketId: string
  itemId: number
}

export function useRemovePart() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ ticketId, itemId }: RemovePartInput) =>
      api<{ success: boolean }>(`/api/tickets/${ticketId}/items`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId }),
      }),
    onSuccess: (_, { ticketId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tickets.detail(ticketId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory.all })
    },
  })
}
