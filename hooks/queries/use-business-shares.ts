import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { queryKeys } from "@/lib/query-keys"

export interface ShareTransaction {
  id: number
  transactionType: string
  sellerMemberId: number | null
  sellerName: string | null
  buyerMemberId: number | null
  buyerName: string | null
  sharesCount: string
  pricePerShare: string
  totalAmount: string
  transactionDate: string
  notes: string | null
  createdAt: string
}

export function useBusinessShares() {
  return useQuery({
    queryKey: queryKeys.business.shares.all,
    queryFn: () => api<{ transactions: ShareTransaction[] }>("/api/business/shares"),
    select: (data) => data.transactions,
  })
}
