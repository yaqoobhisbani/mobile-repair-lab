import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { queryKeys } from "@/lib/query-keys"

export interface ProfitEntry {
  period: string
  partsProfit: number
  laborProfit: number
  salesProfit: number
  totalProfit: number
  ticketCount: number
  saleCount: number
}

export interface ProfitSummary {
  totalPartsProfit: number
  totalLaborProfit: number
  totalSalesProfit: number
  totalProfit: number
  totalTickets: number
  totalSales: number
}

export interface DetailEntry {
  type: "ticket" | "sale"
  id: string
  date: string
  description: string
  partsProfit: number
  laborProfit: number
  totalProfit: number
}

export function useProfitReport(params: Record<string, string>) {
  const searchParams = new URLSearchParams(params)
  return useQuery({
    queryKey: queryKeys.reports.profit(params),
    queryFn: () =>
      api<{ data: ProfitEntry[]; summary: ProfitSummary; details: DetailEntry[] }>(
        `/api/reports/profit?${searchParams.toString()}`
      ),
    staleTime: 0,
  })
}
