"use client"

import { ThemeProvider } from "next-themes"
import { Toaster } from "sonner"
import { AuthProvider } from "@/lib/auth-context"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
        {children}
        <Toaster richColors closeButton position="top-right" />
      </ThemeProvider>
    </AuthProvider>
  )
}
