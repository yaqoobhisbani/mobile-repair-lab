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

export function useAccounts() {
  return useQuery({
    queryKey: queryKeys.accounts.all,
    queryFn: () => api<{ accounts: Account[] }>("/api/accounts"),
    select: (data) => data.accounts,
  })
}
