// @vitest-environment jsdom
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"

describe("Input", () => {
  it("renders with placeholder", () => {
    render(<Input placeholder="Enter name" />)
    expect(screen.getByPlaceholderText("Enter name")).toBeInTheDocument()
  })

  it("renders with value", () => {
    render(<Input value="test" onChange={() => {}} />)
    expect(screen.getByDisplayValue("test")).toBeInTheDocument()
  })

  it("is disabled when disabled prop is set", () => {
    render(<Input disabled />)
    expect(screen.getByRole("textbox")).toBeDisabled()
  })

  it("applies custom className", () => {
    render(<Input className="custom-class" />)
    expect(screen.getByRole("textbox")).toHaveClass("custom-class")
  })

  it("accepts different input types", () => {
    render(<Input type="number" />)
    expect(screen.getByRole("spinbutton")).toBeInTheDocument()
  })

  it("fires onChange when typing", async () => {
    const onChange = vi.fn()
    render(<Input onChange={onChange} />)
    await userEvent.type(screen.getByRole("textbox"), "a")
    expect(onChange).toHaveBeenCalled()
  })

  it("forwards ref", () => {
    const ref = vi.fn()
    render(<Input ref={ref} />)
    expect(ref).toHaveBeenCalled()
  })
})

describe("Label", () => {
  it("renders label text", () => {
    render(<Label htmlFor="name">Full Name</Label>)
    expect(screen.getByText("Full Name")).toBeInTheDocument()
  })

  it("is associated with input via htmlFor", () => {
    render(
      <>
        <Label htmlFor="email">Email</Label>
        <Input id="email" />
      </>,
    )
    const label = screen.getByText("Email")
    const input = screen.getByRole("textbox")
    expect(label).toHaveAttribute("for", "email")
    expect(input).toHaveAttribute("id", "email")
  })

  it("applies custom className", () => {
    render(<Label className="custom-label">Label</Label>)
    expect(screen.getByText("Label")).toHaveClass("custom-label")
  })
})

describe("Checkbox", () => {
  it("renders unchecked by default", () => {
    render(<Checkbox />)
    const checkbox = screen.getByRole("checkbox")
    expect(checkbox).toBeInTheDocument()
    expect(checkbox).not.toBeChecked()
  })

  it("renders checked when defaultChecked is true", () => {
    render(<Checkbox defaultChecked />)
    expect(screen.getByRole("checkbox")).toBeChecked()
  })

  it("renders checked when checked prop is true", () => {
    render(<Checkbox checked onCheckedChange={() => {}} />)
    expect(screen.getByRole("checkbox")).toBeChecked()
  })

  it("is disabled when disabled prop is set", () => {
    render(<Checkbox disabled />)
    expect(screen.getByRole("checkbox")).toBeDisabled()
  })

  it("fires onCheckedChange when clicked", async () => {
    const onChange = vi.fn()
    render(<Checkbox onCheckedChange={onChange} />)
    await userEvent.click(screen.getByRole("checkbox"))
    expect(onChange).toHaveBeenCalledWith(true)
  })

  it("applies custom className", () => {
    render(<Checkbox className="custom-cb" />)
    expect(screen.getByRole("checkbox")).toHaveClass("custom-cb")
  })
})
