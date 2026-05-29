"use client"

import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { queryKeys } from "@/lib/query-keys"

export interface SaleDetail {
  id: string
  customerId: number | null
  customerName: string | null
  customerPhone: string | null
  paymentAccountId: number
  paymentAccountName: string | null
  paymentAccountType: string | null
  totalAmount: string
  createdAt: string
}

export interface SaleItem {
  id: number
  inventoryId: number
  partName: string | null
  sku: string | null
  quantity: number
  unitPrice: string
}

export function useSale(id: string) {
  return useQuery({
    queryKey: queryKeys.sales.detail(id),
    queryFn: () =>
      api<{ sale: SaleDetail; items: SaleItem[] }>(`/api/sales/${id}`),
    enabled: !!id,
  })
}
