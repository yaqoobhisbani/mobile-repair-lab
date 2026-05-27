import { Badge } from "@/components/ui/badge"

const statusConfig: Record<string, { label: string; className: string }> = {
  received: { label: "Received", className: "bg-gray-100 text-gray-700 hover:bg-gray-100 border-gray-200" },
  diagnosing: { label: "Diagnosing", className: "bg-amber-50 text-amber-700 hover:bg-amber-50 border-amber-200" },
  awaiting_parts: { label: "Awaiting Parts", className: "bg-orange-50 text-orange-700 hover:bg-orange-50 border-orange-200" },
  repairing: { label: "Repairing", className: "bg-blue-50 text-blue-700 hover:bg-blue-50 border-blue-200" },
  ready_for_pickup: { label: "Ready for Pickup", className: "bg-emerald-50 text-emerald-700 hover:bg-emerald-50 border-emerald-200" },
  completed: { label: "Completed", className: "bg-green-100 text-green-700 hover:bg-green-100 border-green-200" },
  cancelled: { label: "Cancelled", className: "bg-red-50 text-red-700 hover:bg-red-50 border-red-200" },
}

interface TicketStatusBadgeProps {
  status: string
}

export function TicketStatusBadge({ status }: TicketStatusBadgeProps) {
  const config = statusConfig[status] || { label: status, className: "bg-gray-100 text-gray-700" }
  return <Badge variant="outline" className={config.className}>{config.label}</Badge>
}
