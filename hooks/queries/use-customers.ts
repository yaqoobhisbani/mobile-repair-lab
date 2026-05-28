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

export function useCustomers() {
  return useQuery({
    queryKey: queryKeys.customers.all,
    queryFn: () => api<{ customers: Customer[] }>("/api/customers"),
    select: (data) => data.customers,
  })
}
