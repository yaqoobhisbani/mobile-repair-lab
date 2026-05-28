import { useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { queryKeys } from "@/lib/query-keys"

interface CreateTicketInput {
  customerId: number
  brand: string
  model: string
  imei?: string
  passcode?: string
  problemCategory: string
  problemDescription?: string
  laborCost?: number
}

export function useCreateTicket() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateTicketInput) =>
      api<{ ticket: any }>("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tickets.all })
    },
  })
}
