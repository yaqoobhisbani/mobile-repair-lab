import { useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { queryKeys } from "@/lib/query-keys"

interface UpdateBusinessMemberInput {
  id: number
  name?: string
  email?: string
  phone?: string
  role?: string
}

export function useUpdateBusinessMember() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: UpdateBusinessMemberInput) =>
      api<{ member: any }>(`/api/business/members/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.business.members.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.business.members.detail(variables.id) })
    },
  })
}
