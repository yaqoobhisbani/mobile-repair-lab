"use client"

import { useState, useRef, useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { useQuery } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { useTheme } from "next-themes"
import {
  Search,
  LogOut,
  Settings,
  Sun,
  Moon,
  LayoutDashboard,
  ClipboardList,
  Users,
  Package,
  BarChart3,
  Landmark,
  Receipt,
  Loader2,
  Ticket,
} from "lucide-react"

interface NavItem {
  label: string
  href: string
  icon: React.ReactNode
}

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
  { label: "Tickets", href: "/dashboard/tickets", icon: <ClipboardList className="h-4 w-4" /> },
  { label: "Customers", href: "/dashboard/customers", icon: <Users className="h-4 w-4" /> },
  { label: "Inventory", href: "/dashboard/inventory", icon: <Package className="h-4 w-4" /> },
  { label: "Reports", href: "/dashboard/reports", icon: <BarChart3 className="h-4 w-4" /> },
  { label: "Accounts", href: "/dashboard/finance/accounts", icon: <Landmark className="h-4 w-4" /> },
  { label: "Expenses", href: "/dashboard/finance/expenses", icon: <Receipt className="h-4 w-4" /> },
  { label: "Settings", href: "/dashboard/settings", icon: <Settings className="h-4 w-4" /> },
]

const breadcrumbLabels: Record<string, string> = {
  dashboard: "Dashboard",
  tickets: "Tickets",
  sales: "Sales",
  inventory: "Inventory",
  customers: "Customers",
  reports: "Reports",
  finance: "Finance",
  accounts: "Accounts",
  expenses: "Expenses",
  settings: "Settings",
  new: "New",
}

interface SearchResult {
  id: string
  label: string
  href: string
  type: "ticket" | "customer" | "inventory"
}

function useBreadcrumbs(pathname: string) {
  const segments = pathname.split("/").filter(Boolean)
  const crumbs: { label: string; href: string }[] = []
  let href = ""
  for (const s of segments) {
    href += `/${s}`
    const label = breadcrumbLabels[s] ?? decodeURIComponent(s)
    crumbs.push({ label, href })
  }
  return crumbs
}

export function DashboardHeader() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuth()
  const { theme, setTheme } = useTheme()
  const crumbs = useBreadcrumbs(pathname)
  const [commandOpen, setCommandOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const searchInputRef = useRef<HTMLInputElement>(null)

  const performSearch = (query: string) => {
    setSearchQuery(query)
  }

  const { data: searchData, isLoading: searchLoading } = useQuery({
    queryKey: ["command-search", searchQuery],
    queryFn: async () => {
      const [ticketsRes, customersRes, inventoryRes] = await Promise.all([
        fetch(`/api/tickets?search=${encodeURIComponent(searchQuery)}&limit=4`).then((r) => r.json()),
        fetch(`/api/customers?search=${encodeURIComponent(searchQuery)}&limit=3`).then((r) => r.json()),
        fetch(`/api/inventory?search=${encodeURIComponent(searchQuery)}&limit=3`).then((r) => r.json()),
      ])
      const results: SearchResult[] = []
      ;(ticketsRes.tickets ?? []).forEach((t: { id: string; customerName?: string; brand?: string; model?: string }) =>
        results.push({
          id: t.id,
          label: `${t.id} — ${t.customerName ?? "Unknown"} (${t.brand ?? ""} ${t.model ?? ""})`,
          href: `/dashboard/tickets/${t.id}`,
          type: "ticket",
        }),
      )
      ;(customersRes.customers ?? []).forEach((c: { id: number; name: string; phone?: string }) =>
        results.push({
          id: `c${c.id}`,
          label: `${c.name}${c.phone ? ` — ${c.phone}` : ""}`,
          href: `/dashboard/customers/${c.id}`,
          type: "customer",
        }),
      )
      ;(inventoryRes.items ?? []).forEach((item: { id: number; partName: string; sku: string }) =>
        results.push({
          id: `i${item.id}`,
          label: `${item.partName} (${item.sku})`,
          href: `/dashboard/inventory/${item.id}`,
          type: "inventory",
        }),
      )
      return results.slice(0, 10)
    },
    enabled: searchQuery.length > 0,
  })

  const results = searchData ?? []

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        setCommandOpen(true)
      }
    }
    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [])

  useEffect(() => {
    if (commandOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 100)
    }
  }, [commandOpen])

  function handleSearch(value: string) {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => performSearch(value), 300)
  }

  function handleSelect(href: string) {
    setCommandOpen(false)
    setSearchQuery("")
    router.push(href)
  }

  return (
    <>
      <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 md:px-6">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {crumbs.length > 0 && (
            <nav className="flex items-center gap-1.5 text-sm text-muted-foreground truncate">
              {crumbs.map((crumb, i) => (
                <span key={crumb.href} className="flex items-center gap-1.5">
                  {i > 0 && <span className="text-muted-foreground/40">/</span>}
                  {i < crumbs.length - 1 ? (
                    <button
                      onClick={() => router.push(crumb.href)}
                      className="hover:text-foreground transition-colors"
                    >
                      {crumb.label}
                    </button>
                  ) : (
                    <span className="text-foreground font-medium truncate">{crumb.label}</span>
                  )}
                </span>
              ))}
            </nav>
          )}
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="hidden sm:flex text-muted-foreground"
            onClick={() => setCommandOpen(true)}
            title="Search (Cmd+K)"
          >
            <Search className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            title={theme === "dark" ? "Light Mode" : "Dark Mode"}
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full h-8 w-8">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold">
                  {user?.name?.charAt(0)?.toUpperCase() ?? "U"}
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{user?.name}</span>
                  <span className="text-xs text-muted-foreground font-normal">{user?.email}</span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push("/dashboard/settings")}>
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  logout()
                  router.push("/login")
                }}
                className="text-destructive focus:text-destructive"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <CommandDialog open={commandOpen} onOpenChange={setCommandOpen}>
        <CommandInput ref={searchInputRef} placeholder="Search tickets, customers, parts..." onValueChange={handleSearch} />
        <CommandList>
          <CommandEmpty>{searchLoading ? "Searching..." : "No results found."}</CommandEmpty>

          {searchLoading && (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          )}

          {!searchLoading && results.length > 0 && (
            <>
              {results.some((r) => r.type === "ticket") && (
                <CommandGroup heading="Tickets">
                  {results
                    .filter((r) => r.type === "ticket")
                    .map((r) => (
                      <CommandItem key={r.id} value={r.id} onSelect={() => handleSelect(r.href)}>
                        <Ticket className="h-4 w-4 mr-2 text-blue-500" />
                        {r.label}
                      </CommandItem>
                    ))}
                </CommandGroup>
              )}
              {results.some((r) => r.type === "customer") && (
                <CommandGroup heading="Customers">
                  {results
                    .filter((r) => r.type === "customer")
                    .map((r) => (
                      <CommandItem key={r.id} value={r.id} onSelect={() => handleSelect(r.href)}>
                        <Users className="h-4 w-4 mr-2 text-emerald-500" />
                        {r.label}
                      </CommandItem>
                    ))}
                </CommandGroup>
              )}
              {results.some((r) => r.type === "inventory") && (
                <CommandGroup heading="Inventory">
                  {results
                    .filter((r) => r.type === "inventory")
                    .map((r) => (
                      <CommandItem key={r.id} value={r.id} onSelect={() => handleSelect(r.href)}>
                        <Package className="h-4 w-4 mr-2 text-amber-500" />
                        {r.label}
                      </CommandItem>
                    ))}
                </CommandGroup>
              )}
            </>
          )}

          {!searchLoading && results.length === 0 && (
            <>
              <CommandGroup heading="Quick Navigation">
                {navItems.map((item) => (
                  <CommandItem
                    key={item.href}
                    value={item.href}
                    onSelect={() => handleSelect(item.href)}
                  >
                    {item.icon}
                    <span className="ml-2">{item.label}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}
        </CommandList>
      </CommandDialog>
    </>
  )
}