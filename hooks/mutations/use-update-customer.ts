import { useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { queryKeys } from "@/lib/query-keys"

interface UpdateCustomerInput {
  id: number
  name?: string
  phone?: string
  email?: string | null
}

export function useUpdateCustomer() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: UpdateCustomerInput) =>
      api<{ customer: any }>(`/api/customers/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.customers.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.customers.detail(id) })
    },
  })
}
