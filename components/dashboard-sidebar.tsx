"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { useAuth } from "@/lib/auth-context"
import { useTheme } from "next-themes"
import {
  LayoutDashboard,
  ClipboardList,
  Package,
  Users,
  Settings,
  Wrench,
  Wallet,
  Landmark,
  X,
  LogOut,
  BarChart3,
  Sun,
  Moon,
  Building2,
} from "lucide-react"

const mainNavItems = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
]

const operationsNavItems = [
  { href: "/dashboard/tickets", label: "Tickets", icon: ClipboardList },
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
  const router = useRouter()
  const { user, logout } = useAuth()
  const { theme, setTheme } = useTheme()

  const handleLogout = () => {
    logout()
    router.push("/login")
    onClose?.()
  }

  return (
    <div className="flex h-full flex-col gap-4 py-4">
      <div className="flex items-center justify-between px-4">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">
            MRL
          </div>
          <span className="font-semibold">Mobile Repair Lab</span>
        </Link>
        {onClose && (
          <Button variant="ghost" size="icon" onClick={onClose} className="md:hidden">
            <X className="h-5 w-5" />
          </Button>
        )}
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

      <Separator />

      <div className="space-y-2 px-3">
        <Link href="/">
          <Button variant="outline" size="sm" className="w-full justify-start">
            <Wrench className="h-4 w-4 mr-2" />
            Public Site
          </Button>
        </Link>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-muted-foreground"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          {theme === "dark" ? <Sun className="h-4 w-4 mr-2" /> : <Moon className="h-4 w-4 mr-2" />}
          {theme === "dark" ? "Light Mode" : "Dark Mode"}
        </Button>
        <Button variant="ghost" size="sm" className="w-full justify-start text-muted-foreground" onClick={handleLogout}>
          <LogOut className="h-4 w-4 mr-2" />
          Sign Out
        </Button>
      </div>
    </div>
  )
}
