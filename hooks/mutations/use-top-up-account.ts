import { useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { queryKeys } from "@/lib/query-keys"

interface TopUpInput {
  id: number
  amount: number
  description?: string
}

export function useTopUpAccount() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, amount, description }: TopUpInput) =>
      api<{ account: any }>(`/api/accounts/${id}/topup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, description }),
      }),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.accounts.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.accounts.detail(id) })
    },
  })
}
