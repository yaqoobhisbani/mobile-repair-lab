"use client"

import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { queryKeys } from "@/lib/query-keys"

export interface SaleListItem {
  id: string
  customerId: number | null
  customerName: string | null
  customerPhone: string | null
  paymentAccountId: number
  paymentAccountName: string | null
  totalAmount: string
  createdAt: string
}

export function useSales() {
  return useQuery({
    queryKey: queryKeys.sales.all,
    queryFn: () => api<{ sales: SaleListItem[] }>("/api/sales"),
    select: (data) => data.sales,
  })
}
