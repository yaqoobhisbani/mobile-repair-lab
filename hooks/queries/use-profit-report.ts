import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { queryKeys } from "@/lib/query-keys"

export interface ProfitEntry {
  period: string
  partsProfit: number
  laborProfit: number
  totalProfit: number
  ticketCount: number
}

export interface ProfitSummary {
  totalPartsProfit: number
  totalLaborProfit: number
  totalProfit: number
  totalTickets: number
}

export function useProfitReport(params: Record<string, string>) {
  const searchParams = new URLSearchParams(params)
  return useQuery({
    queryKey: queryKeys.reports.profit(params),
    queryFn: () =>
      api<{ data: ProfitEntry[]; summary: ProfitSummary }>(
        `/api/reports/profit?${searchParams.toString()}`
      ),
    staleTime: 0,
  })
}
