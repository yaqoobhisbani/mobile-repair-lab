import { useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { queryKeys } from "@/lib/query-keys"

interface TransferInput {
  sourceId: number
  toAccountId: number
  amount: number
  description?: string
}

export function useTransferAccount() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ sourceId, toAccountId, amount, description }: TransferInput) =>
      api<{ source: any; destination: any }>(`/api/accounts/${sourceId}/transfer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toAccountId, amount, description }),
      }),
    onSuccess: (_, { sourceId, toAccountId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.accounts.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.accounts.detail(sourceId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.accounts.detail(toAccountId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.accounts.transactions(sourceId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.accounts.transactions(toAccountId) })
    },
  })
}
