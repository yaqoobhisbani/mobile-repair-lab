import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { queryKeys } from "@/lib/query-keys"

export interface TicketListItem {
  id: string
  customerId: number
  customerName: string | null
  customerPhone: string | null
  brand: string
  model: string
  status: string
  paymentStatus: string
  createdAt: string
}

export function useTickets() {
  return useQuery({
    queryKey: queryKeys.tickets.all,
    queryFn: () => api<{ tickets: TicketListItem[] }>("/api/tickets"),
    select: (data) => data.tickets,
  })
}
