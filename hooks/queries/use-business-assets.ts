import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { queryKeys } from "@/lib/query-keys"

export interface BusinessAsset {
  id: number
  name: string
  description: string | null
  costPrice: string
  currentValue: string
  purchaseDate: string
  purchasedByMemberId: number | null
  purchasedByName: string | null
  fundingSource: string
  depreciationRate: string | null
  createdAt: string
}

export function useBusinessAssets() {
  return useQuery({
    queryKey: queryKeys.business.assets.all,
    queryFn: () => api<{ assets: BusinessAsset[] }>("/api/business/assets"),
    select: (data) => data.assets,
  })
}
