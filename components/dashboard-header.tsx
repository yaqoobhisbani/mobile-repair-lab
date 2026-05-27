"use client"

import { useState, useRef, useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import { Search, Bell, LogOut, Settings, User, Command, Sun, Moon } from "lucide-react"

const breadcrumbLabels: Record<string, string> = {
  dashboard: "Dashboard",
  tickets: "Tickets",
  inventory: "Inventory",
  customers: "Customers",
  reports: "Reports",
  finance: "Finance",
  accounts: "Accounts",
  expenses: "Expenses",
  settings: "Settings",
  new: "New",
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
  const [searchResults, setSearchResults] = useState<{ id: string; label: string; href: string }[]>([])
  const searchRef = useRef<HTMLInputElement>(null)

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

  async function handleSearch(query: string) {
    if (!query.trim()) {
      setSearchResults([])
      return
    }
    try {
      const [tickets, customers] = await Promise.all([
        fetch(`/api/tickets?search=${encodeURIComponent(query)}&limit=5`).then((r) => r.json()),
        fetch(`/api/customers?search=${encodeURIComponent(query)}&limit=5`).then((r) => r.json()),
      ])
      const results: { id: string; label: string; href: string }[] = []
      ;(tickets.tickets ?? []).forEach((t: { id: string; customerName?: string; brand?: string; model?: string }) =>
        results.push({ id: t.id, label: `${t.id} — ${t.customerName ?? "Unknown"}`, href: `/dashboard/tickets/${t.id}` })
      )
      ;(customers.customers ?? []).forEach((c: { id: number; name: string }) =>
        results.push({ id: `c${c.id}`, label: c.name, href: `/dashboard/customers/${c.id}` })
      )
      setSearchResults(results.slice(0, 8))
    } catch {
      setSearchResults([])
    }
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
        <CommandInput placeholder="Search tickets and customers..." onValueChange={handleSearch} />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          {searchResults.length > 0 && (
            <CommandGroup heading="Results">
              {searchResults.map((r) => (
                <CommandItem
                  key={r.id}
                  value={r.id}
                  onSelect={() => {
                    setCommandOpen(false)
                    router.push(r.href)
                  }}
                >
                  <Search className="h-4 w-4 mr-2" />
                  {r.label}
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>
    </>
  )
}
