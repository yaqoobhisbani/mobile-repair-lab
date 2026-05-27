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

const cancelledStatus = { key: "cancelled", label: "Cancelled" }

interface StatusTimelineProps {
  currentStatus: string
}

export function StatusTimeline({ currentStatus }: StatusTimelineProps) {
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
            <div className={cn("pt-1", isCurrent && "font-medium")}>
              <p className={cn("text-sm", isCurrent ? "text-foreground" : "text-muted-foreground")}>
                {status.label}
              </p>
              {isCurrent && <p className="text-xs text-muted-foreground">Current</p>}
            </div>
          </div>
        )
      })}
    </div>
  )
}
