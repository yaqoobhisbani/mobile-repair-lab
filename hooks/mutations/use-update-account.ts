import { useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { queryKeys } from "@/lib/query-keys"

interface UpdateAccountInput {
  id: number
  name?: string
  type?: "bank" | "cash"
  description?: string | null
}

export function useUpdateAccount() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: UpdateAccountInput) =>
      api<{ account: any }>(`/api/accounts/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.accounts.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.accounts.detail(id) })
    },
  })
}
