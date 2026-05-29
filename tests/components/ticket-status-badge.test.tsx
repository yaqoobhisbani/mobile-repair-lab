// @vitest-environment jsdom
import { render, screen } from "@testing-library/react"
import { TicketStatusBadge } from "@/components/ticket-status-badge"

describe("TicketStatusBadge", () => {
  it("renders 'Received' for received status", () => {
    render(<TicketStatusBadge status="received" />)
    expect(screen.getByText("Received")).toBeInTheDocument()
  })

  it("renders 'Diagnosing' for diagnosing status", () => {
    render(<TicketStatusBadge status="diagnosing" />)
    expect(screen.getByText("Diagnosing")).toBeInTheDocument()
  })

  it("renders 'Awaiting Parts' for awaiting_parts status", () => {
    render(<TicketStatusBadge status="awaiting_parts" />)
    expect(screen.getByText("Awaiting Parts")).toBeInTheDocument()
  })

  it("renders 'Repairing' for repairing status", () => {
    render(<TicketStatusBadge status="repairing" />)
    expect(screen.getByText("Repairing")).toBeInTheDocument()
  })

  it("renders 'Ready for Pickup' for ready_for_pickup status", () => {
    render(<TicketStatusBadge status="ready_for_pickup" />)
    expect(screen.getByText("Ready for Pickup")).toBeInTheDocument()
  })

  it("renders 'Completed' for completed status", () => {
    render(<TicketStatusBadge status="completed" />)
    expect(screen.getByText("Completed")).toBeInTheDocument()
  })

  it("renders 'Cancelled' for cancelled status", () => {
    render(<TicketStatusBadge status="cancelled" />)
    expect(screen.getByText("Cancelled")).toBeInTheDocument()
  })

  it("falls back to raw status string for unknown status", () => {
    render(<TicketStatusBadge status="unknown" />)
    expect(screen.getByText("unknown")).toBeInTheDocument()
  })

  it("applies correct color classes for each status", () => {
    const { rerender } = render(<TicketStatusBadge status="received" />)
    expect(screen.getByText("Received")).toHaveClass("bg-gray-100", "text-gray-700")

    rerender(<TicketStatusBadge status="diagnosing" />)
    expect(screen.getByText("Diagnosing")).toHaveClass("bg-amber-50", "text-amber-700")

    rerender(<TicketStatusBadge status="completed" />)
    expect(screen.getByText("Completed")).toHaveClass("bg-green-100", "text-green-700")

    rerender(<TicketStatusBadge status="cancelled" />)
    expect(screen.getByText("Cancelled")).toHaveClass("bg-red-50", "text-red-700")
  })
})
