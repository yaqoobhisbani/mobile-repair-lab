import { useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { queryKeys } from "@/lib/query-keys"

interface CreateBusinessAssetInput {
  name: string
  description?: string
  costPrice: number | string
  purchaseDate?: string
  purchasedByMemberId?: number | null
  fundingSource?: string
  depreciationRate?: number | string
  accountId?: number | null
}

export function useCreateBusinessAsset() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateBusinessAssetInput) =>
      api<{ asset: any }>("/api/business/assets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.business.assets.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.business.members.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.business.shares.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.business.dashboard })
    },
  })
}
