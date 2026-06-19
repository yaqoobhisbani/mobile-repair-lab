import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { queryKeys } from "@/lib/query-keys"

export interface BusinessDashboard {
  totalShares: string
  totalAssetValue: string
  totalShopCash: string
  navPerShare: string
  memberCount: number
  shareholding: {
    memberId: number
    memberName: string
    sharesOwned: string
    ownershipPercent: string
  }[]
  recentTransactions: {
    id: number
    transactionType: string
    sharesCount: string
    totalAmount: string
    transactionDate: string
  }[]
}

export function useBusinessDashboard() {
  return useQuery({
    queryKey: queryKeys.business.dashboard,
    queryFn: () => api<BusinessDashboard>("/api/business/dashboard"),
  })
}
