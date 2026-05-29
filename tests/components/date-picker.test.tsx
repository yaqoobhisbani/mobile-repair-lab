// @vitest-environment jsdom
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { DatePicker } from "@/components/date-picker"

describe("DatePicker", () => {
  it("renders placeholder when no value", () => {
    render(<DatePicker value={undefined} onChange={() => {}} placeholder="Select date" />)
    expect(screen.getByText("Select date")).toBeInTheDocument()
  })

  it("renders formatted date when value is provided", () => {
    render(<DatePicker value={new Date(2025, 0, 15)} onChange={() => {}} />)
    expect(screen.getByText(/January.*2025/)).toBeInTheDocument()
  })

  it("opens calendar popover on click", async () => {
    render(<DatePicker value={undefined} onChange={() => {}} />)
    await userEvent.click(screen.getByText("Pick a date"))
    expect(screen.getByRole("grid")).toBeInTheDocument()
  })

  it("is disabled when disabled prop is set", () => {
    render(<DatePicker value={undefined} onChange={() => {}} disabled />)
    expect(screen.getByRole("button")).toBeDisabled()
  })

  it("applies className to trigger button", () => {
    render(<DatePicker value={undefined} onChange={() => {}} className="custom-dp" />)
    expect(screen.getByRole("button")).toHaveClass("custom-dp")
  })
})
