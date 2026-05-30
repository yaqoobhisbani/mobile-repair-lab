import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { queryKeys } from "@/lib/query-keys"

export interface ReportEntry {
  period: string
  partsRevenue: number
  partsProfit: number
  laborRevenue: number
  laborProfit: number
  salesRevenue: number
  salesProfit: number
  totalRevenue: number
  totalProfit: number
  ticketCount: number
  saleCount: number
}

export interface ReportSummary {
  totalPartsRevenue: number
  totalPartsProfit: number
  totalLaborRevenue: number
  totalLaborProfit: number
  totalSalesRevenue: number
  totalSalesProfit: number
  totalRevenue: number
  totalProfit: number
  totalTickets: number
  totalSales: number
}

export interface DetailEntry {
  type: "ticket" | "sale"
  id: string
  date: string
  description: string
  revenue: { parts: number; labor: number; total: number }
  profit: { parts: number; labor: number; total: number }
}

export function useProfitReport(params: Record<string, string>) {
  const searchParams = new URLSearchParams(params)
  return useQuery({
    queryKey: queryKeys.reports.profit(params),
    queryFn: () =>
      api<{ data: ReportEntry[]; summary: ReportSummary; details: DetailEntry[] }>(
        `/api/reports/profit?${searchParams.toString()}`
      ),
    staleTime: 0,
  })
}
