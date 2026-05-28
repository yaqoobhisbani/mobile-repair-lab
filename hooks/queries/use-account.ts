import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { queryKeys } from "@/lib/query-keys"

export interface Account {
  id: number
  name: string
  type: "bank" | "cash"
  balance: string
  description: string | null
  createdAt: string
}

export function useAccount(id: number) {
  return useQuery({
    queryKey: queryKeys.accounts.detail(id),
    queryFn: () => api<{ account: Account }>(`/api/accounts/${id}`),
    select: (data) => data.account,
    enabled: !!id,
  })
}
