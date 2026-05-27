import { Badge } from "@/components/ui/badge"

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  received: { label: "Received", variant: "secondary" },
  diagnosing: { label: "Diagnosing", variant: "outline" },
  awaiting_parts: { label: "Awaiting Parts", variant: "outline" },
  repairing: { label: "Repairing", variant: "default" },
  ready_for_pickup: { label: "Ready for Pickup", variant: "default" },
  completed: { label: "Completed", variant: "secondary" },
  cancelled: { label: "Cancelled", variant: "destructive" },
}

interface TicketStatusBadgeProps {
  status: string
}

export function TicketStatusBadge({ status }: TicketStatusBadgeProps) {
  const config = statusConfig[status] || { label: status, variant: "outline" as const }
  return <Badge variant={config.variant}>{config.label}</Badge>
}
