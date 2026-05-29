// @vitest-environment jsdom
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MonthPicker } from "@/components/month-picker"

describe("MonthPicker", () => {
  it("renders current month and year", () => {
    const date = new Date(2025, 5, 1)
    render(<MonthPicker value={date} onChange={() => {}} />)
    expect(screen.getByText("June 2025")).toBeInTheDocument()
  })

  it("opens popover on click", async () => {
    const date = new Date(2025, 0, 1)
    render(<MonthPicker value={date} onChange={() => {}} />)
    await userEvent.click(screen.getByText("January 2025"))
    expect(screen.getByText("Jan")).toBeInTheDocument()
    expect(screen.getByText("Feb")).toBeInTheDocument()
    expect(screen.getByText("Dec")).toBeInTheDocument()
  })

  it("calls onChange when month is selected", async () => {
    const onChange = vi.fn()
    const date = new Date(2025, 0, 1)
    render(<MonthPicker value={date} onChange={onChange} />)
    await userEvent.click(screen.getByText("January 2025"))
    await userEvent.click(screen.getByText("Mar"))
    expect(onChange).toHaveBeenCalled()
  })

  it("applies className to trigger button", () => {
    render(<MonthPicker value={new Date()} onChange={() => {}} className="custom-mp" />)
    expect(screen.getByRole("button")).toHaveClass("custom-mp")
  })
})
