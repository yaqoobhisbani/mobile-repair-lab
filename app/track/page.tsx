"use client"

import { useState } from "react"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { StatusTimeline } from "@/components/status-timeline"
import { Search, Smartphone } from "lucide-react"

export default function TrackPage() {
  const [query, setQuery] = useState("")
  const [searched, setSearched] = useState(false)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setSearched(true)
  }

  return (
    <>
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-12">
        <div className="mx-auto max-w-2xl space-y-8">
          <div className="text-center space-y-2">
            <Smartphone className="mx-auto h-12 w-12 text-primary" />
            <h1 className="text-3xl font-bold">Track Your Repair</h1>
            <p className="text-muted-foreground">
              Enter your Ticket ID or Phone Number to check the status of your device repair.
            </p>
          </div>

          <form onSubmit={handleSearch} className="flex gap-3">
            <Input
              placeholder="Enter Ticket ID or Phone Number..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1"
            />
            <Button type="submit">
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
          </form>

          {searched && (
            <Card>
              <CardHeader>
                <CardTitle>Repair Status</CardTitle>
                <CardDescription>
                  Ticket #{query || "N/A"} — Apple iPhone 15 Pro
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-6 text-sm">
                  <div>
                    <span className="text-muted-foreground">Customer:</span> John Doe
                  </div>
                  <div>
                    <span className="text-muted-foreground">Issue:</span> Broken Screen
                  </div>
                  <div>
                    <span className="text-muted-foreground">Est. Completion:</span> Jun 1, 2026
                  </div>
                </div>
                <StatusTimeline currentStatus="repairing" />
              </CardContent>
            </Card>
          )}

          {!searched && (
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
