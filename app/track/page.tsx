"use client"

import { useState, useCallback } from "react"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { StatusTimeline } from "@/components/status-timeline"
import { Search, Smartphone, Loader2, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

function toTitleCase(str: string) {
  return str.replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
}

const statusLabels: Record<string, string> = {
  received: "Received",
  diagnosing: "Diagnosing",
  awaiting_parts: "Awaiting Parts",
  repairing: "Repairing",
  ready_for_pickup: "Ready for Pickup",
  completed: "Completed",
  cancelled: "Cancelled",
}

export default function TrackPage() {
  const [query, setQuery] = useState("")
  const [searched, setSearched] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [ticket, setTicket] = useState<any>(null)
  const [statusHistory, setStatusHistory] = useState<any[]>([])

  const handleSearch = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return
    setSearched(false)
    setLoading(true)
    setError("")
    setTicket(null)
    setStatusHistory([])

    try {
      const res = await fetch(`/api/track/${encodeURIComponent(query.trim())}`)
      if (res.status === 404) {
        setError("No ticket found with that ID. Please check and try again.")
        setSearched(true)
        return
      }
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to fetch ticket")

      setTicket(data.ticket)
      setStatusHistory(data.statusHistory ?? [])
    } catch (err: any) {
      setError(err.message || "Something went wrong")
    } finally {
      setLoading(false)
      setSearched(true)
    }
  }, [query])

  return (
    <>
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-12">
        <div className="mx-auto max-w-2xl space-y-8">
          <div className="text-center space-y-2">
            <Smartphone className="mx-auto h-12 w-12 text-primary" />
            <h1 className="text-3xl font-bold">Track Your Repair</h1>
            <p className="text-muted-foreground">
              Enter your Ticket ID to check the status of your device repair.
            </p>
          </div>

          <form onSubmit={handleSearch} className="flex gap-3">
            <Input
              placeholder="Enter Ticket ID..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 bg-card"
            />
            <Button type="submit" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Search className="h-4 w-4 mr-2" />}
              Search
            </Button>
          </form>

          {loading && (
            <Card>
              <CardContent className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </CardContent>
            </Card>
          )}

          {error && searched && (
            <Card>
              <CardContent className="flex items-center gap-3 py-6">
                <AlertCircle className="h-5 w-5 text-destructive shrink-0" />
                <p className="text-sm text-muted-foreground">{error}</p>
              </CardContent>
            </Card>
          )}

          {ticket && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Repair Status</CardTitle>
                    <CardDescription>
                      Ticket #{ticket.id}
                    </CardDescription>
                  </div>
                  <span className={cn(
                    "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                    ticket.status === "completed" && "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
                    ticket.status === "cancelled" && "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
                    ticket.status === "ready_for_pickup" && "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
                    ticket.status === "repairing" && "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
                    ticket.status === "diagnosing" && "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
                    ticket.status === "awaiting_parts" && "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
                    ticket.status === "received" && "bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-400",
                  )}>
                    {statusLabels[ticket.status] ?? ticket.status}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Device</p>
                    <p className="font-medium">{toTitleCase(ticket.brand)} {ticket.model}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Issue</p>
                    <p className="font-medium">{toTitleCase(ticket.problemCategory)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Submitted</p>
                    <p className="font-medium">{new Date(ticket.createdAt).toLocaleDateString("en-GB")}</p>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium mb-3">Progress</h3>
                  <StatusTimeline currentStatus={ticket.status} statusHistory={statusHistory} />
                </div>
              </CardContent>
            </Card>
          )}

          {!searched && !ticket && !loading && (
            <div className="rounded-lg border border-dashed p-8 text-center">
              <p className="text-sm text-muted-foreground">
                Enter your details above to see the current status of your repair.
              </p>
            </div>
          )}
        </div>
      </main>
    </>
  )
}
