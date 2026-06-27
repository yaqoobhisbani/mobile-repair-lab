"use client"

import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Building2, Store } from "lucide-react"

export function PortalSwitcher() {
  const pathname = usePathname()
  const router = useRouter()
  const isBusiness = pathname.startsWith("/business")

  return (
    <div className="flex items-center rounded-lg border p-0.5 bg-muted/50">
      <button
        onClick={() => router.push("/dashboard")}
        className={cn(
          "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-all",
          !isBusiness
            ? "bg-background shadow-sm text-foreground"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        <Store className="h-3.5 w-3.5" />
        Shop
      </button>
      <button
        onClick={() => router.push("/business")}
        className={cn(
          "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-all",
          isBusiness
            ? "bg-background shadow-sm text-foreground"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        <Building2 className="h-3.5 w-3.5" />
        Business
      </button>
    </div>
  )
}
