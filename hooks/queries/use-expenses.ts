import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { queryKeys } from "@/lib/query-keys"

export interface Expense {
  id: number
  description: string
  amount: string
  category: string | null
  accountId: number
  accountName: string | null
  date: string
  createdAt: string
}

export function useExpenses() {
  return useQuery({
    queryKey: queryKeys.expenses.all,
    queryFn: () => api<{ expenses: Expense[] }>("/api/expenses"),
    select: (data) => data.expenses,
  })
}
