import { useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { queryKeys } from "@/lib/query-keys"

interface UpdateTicketInput {
  id: string
  status?: string
  problemDescription?: string
  laborCost?: number | null
  imei?: string
  passcode?: string
  paymentStatus?: string
  paymentAccountId?: number | null
  amountPaid?: number
}

export function useUpdateTicket() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: UpdateTicketInput) =>
      api<{ ticket: any }>(`/api/tickets/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tickets.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.tickets.detail(id) })
      queryClient.invalidateQueries({ queryKey: queryKeys.accounts.all })
    },
  })
}
