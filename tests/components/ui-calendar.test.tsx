// @vitest-environment jsdom
import { render, screen } from "@testing-library/react"
import { Calendar } from "@/components/ui/calendar"

describe("Calendar", () => {
  it("renders with default month", () => {
    const { container } = render(<Calendar mode="single" />)
    expect(container.querySelector(".rdp")).toBeInTheDocument()
  })

  it("applies className to root element", () => {
    const { container } = render(<Calendar mode="single" className="custom-cal" />)
    const root = container.querySelector(".custom-cal")
    expect(root).toBeInTheDocument()
  })

  it("renders navigation buttons", () => {
    render(<Calendar mode="single" />)
    const buttons = screen.getAllByRole("button")
    expect(buttons.length).toBeGreaterThanOrEqual(2)
  })
})
