import { useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { queryKeys } from "@/lib/query-keys"

export function useDeleteTicket() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      api<{ success: boolean }>(`/api/tickets/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tickets.all })
    },
  })
}
