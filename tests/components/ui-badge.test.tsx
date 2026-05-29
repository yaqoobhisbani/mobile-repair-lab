// @vitest-environment jsdom
import { render, screen } from "@testing-library/react"
import { Badge } from "@/components/ui/badge"

describe("Badge", () => {
  it("renders with default variant", () => {
    render(<Badge>Default</Badge>)
    const badge = screen.getByText("Default")
    expect(badge).toHaveClass("bg-primary", "text-primary-foreground")
  })

  it("renders with secondary variant", () => {
    render(<Badge variant="secondary">Secondary</Badge>)
    expect(screen.getByText("Secondary")).toHaveClass("bg-secondary")
  })

  it("renders with destructive variant", () => {
    render(<Badge variant="destructive">Destructive</Badge>)
    expect(screen.getByText("Destructive")).toHaveClass("bg-destructive")
  })

  it("renders with outline variant", () => {
    render(<Badge variant="outline">Outline</Badge>)
    expect(screen.getByText("Outline")).toHaveClass("text-foreground")
  })

  it("applies custom className", () => {
    render(<Badge className="custom-badge">Custom</Badge>)
    expect(screen.getByText("Custom")).toHaveClass("custom-badge")
  })
})
