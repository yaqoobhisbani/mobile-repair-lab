import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TicketStatusBadge } from "@/components/ticket-status-badge"
import { ClipboardList, Package, DollarSign, AlertTriangle } from "lucide-react"

export default function DashboardOverview() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Overview</h1>
        <p className="text-muted-foreground">Welcome back! Here is what is happening today.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Tickets</CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">+3 from last week</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Parts in Stock</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">147</div>
            <p className="text-xs text-muted-foreground">Across 23 unique parts</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Revenue (This Month)</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Rs. 3,240</div>
            <p className="text-xs text-muted-foreground">+18% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">4</div>
            <p className="text-xs text-muted-foreground">Items need reordering</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Tickets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { id: "TKT-001", customer: "Alice Johnson", device: "iPhone 15 Pro", status: "repairing" },
                { id: "TKT-002", customer: "Bob Smith", device: "Galaxy S24", status: "awaiting_parts" },
                { id: "TKT-003", customer: "Carol White", device: "Pixel 8", status: "ready_for_pickup" },
                { id: "TKT-004", customer: "David Brown", device: "iPhone 14", status: "diagnosing" },
              ].map((ticket) => (
                <div key={ticket.id} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{ticket.customer}</p>
                    <p className="text-xs text-muted-foreground">{ticket.id} — {ticket.device}</p>
                  </div>
                  <TicketStatusBadge status={ticket.status} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Low Stock Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { name: "iPhone 13 OLED Screen", stock: 2, threshold: 5 },
                { name: "Galaxy S24 Battery", stock: 1, threshold: 3 },
                { name: "Pixel 8 Charging Port", stock: 0, threshold: 2 },
                { name: "iPhone 15 Pro Back Glass", stock: 3, threshold: 4 },
              ].map((item) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{item.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Stock: {item.stock} (Threshold: {item.threshold})
                    </p>
                  </div>
                  <span className="text-xs font-medium text-destructive">
                    {item.stock === 0 ? "Out of Stock" : "Low"}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
