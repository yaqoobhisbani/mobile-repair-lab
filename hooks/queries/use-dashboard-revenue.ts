"use client"

import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { queryKeys } from "@/lib/query-keys"

export interface DashboardRevenuePeriod {
  tickets: number
  sales: number
  total: number
}

export interface DashboardRevenue {
  today: DashboardRevenuePeriod
  month: DashboardRevenuePeriod
  year: DashboardRevenuePeriod
  all: DashboardRevenuePeriod
}

export function useDashboardRevenue() {
  return useQuery({
    queryKey: queryKeys.dashboard.revenue,
    queryFn: () => api<DashboardRevenue>("/api/dashboard/revenue"),
  })
}
