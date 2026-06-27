import { useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { queryKeys } from "@/lib/query-keys"

interface CreateBusinessMemberInput {
  name: string
  email?: string
  phone?: string
  role?: string
}

export function useCreateBusinessMember() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateBusinessMemberInput) =>
      api<{ member: any }>("/api/business/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.business.members.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.business.dashboard })
    },
  })
}
