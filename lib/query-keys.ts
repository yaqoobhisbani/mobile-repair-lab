export const queryKeys = {
  tickets: {
    all: ["tickets"] as const,
    detail: (id: string) => ["tickets", id] as const,
  },
  sales: {
    all: ["sales"] as const,
    detail: (id: string) => ["sales", id] as const,
  },
  customers: {
    all: ["customers"] as const,
    detail: (id: number) => ["customers", id] as const,
  },
  inventory: {
    all: ["inventory"] as const,
    detail: (id: number) => ["inventory", id] as const,
  },
  accounts: {
    all: ["accounts"] as const,
    detail: (id: number) => ["accounts", id] as const,
    transactions: (id: number) => ["accounts", id, "transactions"] as const,
  },
  expenses: {
    all: ["expenses"] as const,
  },
  settings: {
    all: ["settings"] as const,
  },
  reports: {
    profit: (params: Record<string, string>) => ["reports", "profit", params] as const,
  },
  dashboard: {
    revenue: ["dashboard", "revenue"] as const,
  },
}
