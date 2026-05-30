import { cn } from "@/lib/utils"
import { Check } from "lucide-react"

const statuses = [
  { key: "received", label: "Received" },
  { key: "diagnosing", label: "Diagnosing" },
  { key: "awaiting_parts", label: "Awaiting Parts" },
  { key: "repairing", label: "Repairing" },
  { key: "ready_for_pickup", label: "Ready for Pickup" },
  { key: "completed", label: "Completed" },
]

interface StatusTimelineProps {
  currentStatus: string
  statusHistory?: { status: string; changedAt: string }[]
}

function formatDate(iso: string) {
  const d = new Date(iso)
  const date = d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Karachi" })
  const time = d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true, timeZone: "Asia/Karachi" })
  return `${date}, ${time}`
}

export function StatusTimeline({ currentStatus, statusHistory = [] }: StatusTimelineProps) {
  const historyMap = new Map(statusHistory.map((h) => [h.status, h.changedAt]))

  if (currentStatus === "cancelled") {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-destructive text-destructive-foreground">
            <Check className="h-4 w-4" />
          </div>
          <div>
            <p className="font-medium text-destructive">Cancelled</p>
            <p className="text-sm text-muted-foreground">This repair was cancelled</p>
          </div>
        </div>
      </div>
    )
  }

  const currentIndex = statuses.findIndex((s) => s.key === currentStatus)

  return (
    <div className="space-y-4">
      {statuses.map((status, index) => {
        const isCompleted = index <= currentIndex
        const isCurrent = index === currentIndex
        const timestamp = historyMap.get(status.key)

        return (
          <div key={status.key} className="flex items-start gap-3">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full border-2 transition-colors",
                  isCompleted
                    ? "bg-primary border-primary text-primary-foreground"
                    : "border-muted-foreground/30 bg-background"
                )}
              >
                {isCompleted ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <div className="h-2 w-2 rounded-full bg-muted-foreground/30" />
                )}
              </div>
              {index < statuses.length - 1 && (
                <div
                  className={cn(
                    "w-0.5 h-8",
                    isCompleted && index < currentIndex ? "bg-primary" : "bg-muted-foreground/20"
                  )}
                />
              )}
            </div>
            <div className="flex-1 min-w-0 pt-1">
              <p className={cn("text-sm", isCurrent ? "font-medium text-foreground" : "text-muted-foreground")}>
                {status.label}
              </p>
              {timestamp && (
                <p className="text-xs text-muted-foreground">{formatDate(timestamp)}</p>
              )}
              {isCurrent && !timestamp && (
                <p className="text-xs text-muted-foreground">Current</p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
