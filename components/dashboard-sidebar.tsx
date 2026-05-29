"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { useAuth } from "@/lib/auth-context"
import { useSettings } from "@/hooks/queries/use-settings"
import {
  LayoutDashboard,
  ClipboardList,
  Package,
  Users,
  Settings,
  Wallet,
  Landmark,
  BarChart3,
  Building2,
  Receipt,
} from "lucide-react"

const mainNavItems = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
]

const operationsNavItems = [
  { href: "/dashboard/tickets", label: "Tickets", icon: ClipboardList },
  { href: "/dashboard/sales", label: "Sales", icon: Receipt },
  { href: "/dashboard/customers", label: "Customers", icon: Users },
  { href: "/dashboard/inventory", label: "Inventory", icon: Package },
]

const financeNavItems = [
  { href: "/dashboard/reports", label: "Reports", icon: BarChart3 },
  { href: "/dashboard/finance/accounts", label: "Accounts", icon: Landmark },
  { href: "/dashboard/finance/expenses", label: "Expenses", icon: Wallet },
]

interface DashboardSidebarProps {
  onClose?: () => void
}

export function DashboardSidebar({ onClose }: DashboardSidebarProps) {
  const pathname = usePathname()
  const { user } = useAuth()
  const { data: settings } = useSettings()
  const shopName = settings?.shopName ?? "Mobile Repair Lab"

  return (
    <div className="flex h-full flex-col gap-4 py-4">
      <div className="flex items-center justify-between px-4">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-sm">
            {shopName.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 3)}
          </div>
          <span className="font-semibold">{shopName}</span>
        </Link>
      </div>

      <div className="px-4">
        <p className="text-sm font-medium truncate">{user?.name}</p>
        <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
      </div>

      <Separator />

      <nav className="flex-1 space-y-1 px-3">
        {mainNavItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
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

        <div className="pt-3 pb-1">
          <div className="flex items-center gap-3 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider">
            <Building2 className="h-4 w-4 text-cyan-600" />
            <span className="bg-gradient-to-r from-cyan-600 to-teal-600 bg-clip-text text-transparent">Operations</span>
          </div>
          {operationsNavItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 pl-9 text-sm font-medium transition-all",
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
        </div>

        <div className="pt-3 pb-1">
          <div className="flex items-center gap-3 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider">
            <BarChart3 className="h-4 w-4 text-emerald-600" />
            <span className="bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">Finance</span>
          </div>
          {financeNavItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 pl-9 text-sm font-medium transition-all",
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
        </div>

        <div className="pt-3 pb-1">
          <Link
            href="/dashboard/settings"
            onClick={onClose}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all",
              pathname.startsWith("/dashboard/settings")
                ? "bg-gradient-to-r from-primary/10 to-transparent text-primary font-semibold"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
          >
            <Settings className="h-4 w-4" />
            Settings
          </Link>
        </div>
      </nav>
    </div>
  )
}