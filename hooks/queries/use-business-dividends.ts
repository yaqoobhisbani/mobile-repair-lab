import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { queryKeys } from "@/lib/query-keys"

export interface DividendDistribution {
  id: number
  memberId: number
  memberName: string | null
  amount: string
  payoutDate: string
  shareholdingPercentage: string
  notes: string | null
  createdAt: string
}

export function useBusinessDividends() {
  return useQuery({
    queryKey: queryKeys.business.dividends.all,
    queryFn: () =>
      api<{ distributions: DividendDistribution[] }>("/api/business/dividends"),
    select: (data) => data.distributions,
  })
}
