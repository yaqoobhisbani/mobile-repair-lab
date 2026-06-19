import { useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { queryKeys } from "@/lib/query-keys"

interface CreateShareTransactionInput {
  transactionType: "initial_issuance" | "internal_transfer" | "equity_withdrawal"
  sellerMemberId?: number | null
  buyerMemberId?: number | null
  sharesCount: number | string
  pricePerShare?: number | string
  notes?: string
}

export function useCreateShareTransaction() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateShareTransactionInput) =>
      api<{ transaction: any }>("/api/business/shares", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.business.shares.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.business.members.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.business.dashboard })
    },
  })
}
