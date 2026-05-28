"use client"

import { QueryClientProvider } from "@tanstack/react-query"
import { ThemeProvider } from "next-themes"
import { Toaster } from "sonner"
import { AuthProvider } from "@/lib/auth-context"
import { getQueryClient } from "@/lib/query-client"

export function Providers({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient()

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          {children}
          <Toaster richColors closeButton position="top-right" />
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  )
}
