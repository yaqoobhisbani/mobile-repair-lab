import { useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { queryKeys } from "@/lib/query-keys"

interface UpdateBusinessAssetInput {
  id: number
  name?: string
  description?: string
  costPrice?: number | string
  purchaseDate?: string
  purchasedByMemberId?: number | null
  fundingSource?: string
  depreciationRate?: number | string
  accountId?: number | null
}

export function useUpdateBusinessAsset() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: UpdateBusinessAssetInput) =>
      api<{ asset: any }>(`/api/business/assets/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.business.assets.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.business.assets.detail(variables.id) })
      queryClient.invalidateQueries({ queryKey: queryKeys.business.dashboard })
    },
  })
}
