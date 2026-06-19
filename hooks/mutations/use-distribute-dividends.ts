import { useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { queryKeys } from "@/lib/query-keys"

interface DistributeDividendsInput {
  totalAmount: number | string
  notes?: string
  accountId?: number | null
}

export function useDistributeDividends() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: DistributeDividendsInput) =>
      api<{ distributions: any[] }>("/api/business/dividends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.business.dividends.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.business.dashboard })
    },
  })
}
