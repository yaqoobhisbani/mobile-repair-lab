// @vitest-environment jsdom
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { Button } from "@/components/ui/button"
import { GradientButton } from "@/components/gradient-button"

describe("Button", () => {
  it("renders with default variant", () => {
    render(<Button>Click me</Button>)
    const btn = screen.getByRole("button", { name: /click me/i })
    expect(btn).toBeInTheDocument()
  })

  it("renders with destructive variant", () => {
    render(<Button variant="destructive">Delete</Button>)
    const btn = screen.getByRole("button", { name: /delete/i })
    expect(btn).toHaveClass("from-rose-600")
  })

  it("renders with outline variant", () => {
    render(<Button variant="outline">Cancel</Button>)
    const btn = screen.getByRole("button", { name: /cancel/i })
    expect(btn).toHaveClass("border-input")
  })

  it("renders with ghost variant", () => {
    render(<Button variant="ghost">Ghost</Button>)
    expect(screen.getByRole("button")).toHaveClass("hover:bg-accent")
  })

  it("renders with link variant", () => {
    render(<Button variant="link">Link</Button>)
    expect(screen.getByRole("button")).toHaveClass("hover:underline")
  })

  it("renders with secondary variant", () => {
    render(<Button variant="secondary">Secondary</Button>)
    expect(screen.getByRole("button")).toHaveClass("bg-secondary")
  })

  it("applies size classes", () => {
    const { rerender } = render(<Button size="sm">Small</Button>)
    expect(screen.getByRole("button")).toHaveClass("h-8")
    rerender(<Button size="lg">Large</Button>)
    expect(screen.getByRole("button")).toHaveClass("h-10")
    rerender(<Button size="icon">Icon</Button>)
    expect(screen.getByRole("button")).toHaveClass("w-9")
  })

  it("is disabled when disabled prop is set", () => {
    render(<Button disabled>Disabled</Button>)
    expect(screen.getByRole("button")).toBeDisabled()
  })

  it("fires onClick when clicked", async () => {
    const onClick = vi.fn()
    render(<Button onClick={onClick}>Click</Button>)
    await userEvent.click(screen.getByRole("button"))
    expect(onClick).toHaveBeenCalledOnce()
  })

  it("renders as child when asChild is used", () => {
    render(
      <Button asChild>
        <a href="/test">Link Button</a>
      </Button>,
    )
    const link = screen.getByRole("link", { name: /link button/i })
    expect(link).toBeInTheDocument()
  })

  it("applies additional className", () => {
    render(<Button className="extra-class">Styled</Button>)
    expect(screen.getByRole("button")).toHaveClass("extra-class")
  })
})

describe("GradientButton", () => {
  it("renders with default gradient", () => {
    render(<GradientButton>Gradient</GradientButton>)
    const btn = screen.getByRole("button", { name: /gradient/i })
    expect(btn).toHaveClass("from-blue-600")
  })

  it("renders with destructive gradient", () => {
    render(<GradientButton gradientVariant="destructive">Delete</GradientButton>)
    expect(screen.getByRole("button")).toHaveClass("from-rose-600")
  })

  it("renders with success gradient", () => {
    render(<GradientButton gradientVariant="success">Success</GradientButton>)
    expect(screen.getByRole("button")).toHaveClass("from-emerald-600")
  })

  it("renders with warning gradient", () => {
    render(<GradientButton gradientVariant="warning">Warning</GradientButton>)
    expect(screen.getByRole("button")).toHaveClass("from-amber-600")
  })

  it("falls back to plain button for outline variant", () => {
    render(<GradientButton variant="outline">Outline</GradientButton>)
    expect(screen.getByRole("button")).toHaveClass("border-input")
  })

  it("fires onClick when clicked", async () => {
    const onClick = vi.fn()
    render(<GradientButton onClick={onClick}>Click</GradientButton>)
    await userEvent.click(screen.getByRole("button"))
    expect(onClick).toHaveBeenCalledOnce()
  })
})
