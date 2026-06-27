"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Separator } from "@/components/ui/separator"
import { useAuth } from "@/lib/auth-context"
import {
  Briefcase,
  Users,
  Package,
  ArrowLeftRight,
  Settings,
} from "lucide-react"

const navItems = [
  { href: "/business", label: "Overview", icon: Briefcase },
  { href: "/business/members", label: "Members", icon: Users },
  { href: "/business/assets", label: "Assets", icon: Package },
  { href: "/business/shares", label: "Shares", icon: ArrowLeftRight },
  { href: "/business/settings", label: "Settings", icon: Settings },
]

interface BusinessSidebarProps {
  onClose?: () => void
}

export function BusinessSidebar({ onClose }: BusinessSidebarProps) {
  const pathname = usePathname()
  const { user } = useAuth()

  return (
    <div className="flex h-full flex-col gap-4 py-4">
      <div className="flex items-center gap-2 px-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-r from-cyan-600 to-teal-600 text-white font-bold text-sm">
          BP
        </div>
        <span className="font-semibold">Business Portal</span>
      </div>

      <div className="px-4">
        <p className="text-sm font-medium truncate">{user?.name}</p>
        <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
      </div>

      <Separator />

      <nav className="flex-1 space-y-1 px-3">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive =
            item.href === "/business"
              ? pathname === "/business"
              : pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all",
                isActive
                  ? "bg-gradient-to-r from-primary/10 to-transparent text-primary font-semibold"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          )
        })}
      </nav>

    </div>
  )
}
