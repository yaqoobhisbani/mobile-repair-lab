// @vitest-environment jsdom
import { render, screen } from "@testing-library/react"
import { StatusTimeline } from "@/components/status-timeline"

describe("StatusTimeline", () => {
  it("renders all status steps for received status", () => {
    render(<StatusTimeline currentStatus="received" />)
    expect(screen.getByText("Received")).toBeInTheDocument()
    expect(screen.getByText("Diagnosing")).toBeInTheDocument()
    expect(screen.getByText("Awaiting Parts")).toBeInTheDocument()
    expect(screen.getByText("Repairing")).toBeInTheDocument()
    expect(screen.getByText("Ready for Pickup")).toBeInTheDocument()
    expect(screen.getByText("Completed")).toBeInTheDocument()
  })

  it("marks current status for received", () => {
    render(<StatusTimeline currentStatus="received" />)
    expect(screen.getByText("Received")).toHaveClass("font-medium", "text-foreground")
    expect(screen.getByText("Diagnosing")).toHaveClass("text-muted-foreground")
  })

  it("marks current status for repairing", () => {
    render(<StatusTimeline currentStatus="repairing" />)
    expect(screen.getByText("Received")).toHaveClass("text-muted-foreground")
    expect(screen.getByText("Repairing")).toHaveClass("font-medium", "text-foreground")
    expect(screen.getByText("Ready for Pickup")).toHaveClass("text-muted-foreground")
  })

  it("renders 'Current' label for current status without timestamp", () => {
    render(<StatusTimeline currentStatus="received" />)
    expect(screen.getByText("Current")).toBeInTheDocument()
  })

  it("renders 'Cancelled' view for cancelled status", () => {
    render(<StatusTimeline currentStatus="cancelled" />)
    expect(screen.getByText("Cancelled")).toBeInTheDocument()
    expect(screen.getByText("This repair was cancelled")).toBeInTheDocument()
  })

  it("does not render status steps when cancelled", () => {
    render(<StatusTimeline currentStatus="cancelled" />)
    expect(screen.queryByText("Diagnosing")).not.toBeInTheDocument()
    expect(screen.queryByText("Completed")).not.toBeInTheDocument()
  })

  it("renders timestamps from status history", () => {
    render(
      <StatusTimeline
        currentStatus="completed"
        statusHistory={[
          { status: "received", changedAt: "2025-01-15T10:00:00Z" },
        ]}
      />,
    )
    expect(screen.getByText(/Jan.*2025/)).toBeInTheDocument()
  })
})
