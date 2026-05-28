import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { queryKeys } from "@/lib/query-keys"

export interface TicketDetail {
  id: string
  customerId: number
  customerName: string | null
  customerPhone: string | null
  customerEmail: string | null
  brand: string
  model: string
  imei: string | null
  passcode: string | null
  problemCategory: string | null
  problemDescription: string | null
  status: string
  paymentStatus: string
  paymentAccountId: number | null
  paymentAccountName: string | null
  paymentAccountType: string | null
  amountPaid: string
  laborCost: string | null
  createdAt: string
}

export interface TicketItem {
  id: number
  inventoryId: number
  partName: string | null
  sku: string | null
  quantityUsed: number
  sellingPrice: string | null
}

export interface StatusHistoryEntry {
  id: number
  status: string
  changedAt: string
}

export function useTicket(id: string) {
  return useQuery({
    queryKey: queryKeys.tickets.detail(id),
    queryFn: () =>
      api<{ ticket: TicketDetail; items: TicketItem[]; statusHistory: StatusHistoryEntry[] }>(
        `/api/tickets/${id}`
      ),
    enabled: !!id,
  })
}
