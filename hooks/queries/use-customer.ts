import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { queryKeys } from "@/lib/query-keys"

export interface Customer {
  id: number
  name: string
  phone: string
  email: string | null
  createdAt: string
}

export function useCustomer(id: number) {
  return useQuery({
    queryKey: queryKeys.customers.detail(id),
    queryFn: () => api<{ customer: Customer }>(`/api/customers/${id}`),
    select: (data) => data.customer,
    enabled: !!id,
  })
}
