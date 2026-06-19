import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { queryKeys } from "@/lib/query-keys"

export interface BusinessMemberDetail {
  member: {
    id: number
    name: string
    email: string | null
    phone: string | null
    role: string
    createdAt: string
  }
  sharesOwned: string
  transactions: {
    id: number
    transactionType: string
    sellerMemberId: number | null
    buyerMemberId: number | null
    sharesCount: string
    pricePerShare: string
    totalAmount: string
    transactionDate: string
    notes: string | null
    createdAt: string
  }[]
  assets: {
    id: number
    name: string
    costPrice: string
    fundingSource: string
    createdAt: string
  }[]
  dividends: {
    id: number
    amount: string
    payoutDate: string
    shareholdingPercentage: string
    notes: string | null
  }[]
}

export function useBusinessMember(id: number) {
  return useQuery({
    queryKey: queryKeys.business.members.detail(id),
    queryFn: () => api<BusinessMemberDetail>(`/api/business/members/${id}`),
  })
}
