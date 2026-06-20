import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { queryKeys } from "@/lib/query-keys"

export interface ShopSettings {
  id: number
  shopName: string
  shopAddress: string
  shopPhone: string
  currency: string
  navPrice: string
}

export function useSettings() {
  return useQuery({
    queryKey: queryKeys.settings.all,
    queryFn: () => api<{ settings: ShopSettings }>("/api/settings"),
    select: (data) => data.settings,
    staleTime: 5 * 60 * 1000,
  })
}
