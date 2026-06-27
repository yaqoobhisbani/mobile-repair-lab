import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { queryKeys } from "@/lib/query-keys"

export interface BusinessMember {
  id: number
  name: string
  email: string | null
  phone: string | null
  role: string
  createdAt: string
  sharesOwned: string
  assetCount: number
}

export function useBusinessMembers() {
  return useQuery({
    queryKey: queryKeys.business.members.all,
    queryFn: () => api<{ members: BusinessMember[] }>("/api/business/members"),
    select: (data) => data.members,
  })
}
