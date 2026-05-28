import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { queryKeys } from "@/lib/query-keys"

export interface Transaction {
  id: number
  accountId: number
  type: string
  amount: string
  description: string
  referenceType: string
  referenceId: string | null
  createdAt: string
}

export function useTransactions(accountId: number) {
  return useQuery({
    queryKey: queryKeys.accounts.transactions(accountId),
    queryFn: () =>
      api<{ account: any; transactions: Transaction[] }>(
        `/api/accounts/${accountId}/transactions`
      ),
    select: (data) => data.transactions,
    enabled: !!accountId,
  })
}
