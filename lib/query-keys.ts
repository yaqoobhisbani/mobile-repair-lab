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
  invoices: {
    byTicket: (ticketId: string) => ["invoices", ticketId] as const,
  },
  business: {
    dashboard: ["business", "dashboard"] as const,
    members: {
      all: ["business", "members"] as const,
      detail: (id: number) => ["business", "members", id] as const,
    },
    assets: {
      all: ["business", "assets"] as const,
      detail: (id: number) => ["business", "assets", id] as const,
    },
      shares: {
        all: ["business", "shares"] as const,
      },
  },
}
