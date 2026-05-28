import { useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { queryKeys } from "@/lib/query-keys"

interface CreateExpenseInput {
  description: string
  amount: number
  category?: string
  accountId: number
  date?: string
}

export function useCreateExpense() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateExpenseInput) =>
      api<{ expense: any }>("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.expenses.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.accounts.all })
    },
  })
}
