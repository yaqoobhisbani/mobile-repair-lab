// @vitest-environment jsdom
import { render } from "@testing-library/react"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"

describe("Separator", () => {
  it("renders horizontal separator by default", () => {
    const { container } = render(<Separator />)
    const sep = container.firstChild as HTMLElement
    expect(sep).toBeInTheDocument()
    expect(sep).toHaveClass("shrink-0", "bg-border")
  })

  it("renders vertical separator", () => {
    const { container } = render(<Separator orientation="vertical" />)
    const sep = container.firstChild as HTMLElement
    expect(sep).toHaveAttribute("data-orientation", "vertical")
  })

  it("applies custom className", () => {
    render(<Separator className="custom-sep" />)
    const sep = document.querySelector(".custom-sep")
    expect(sep).toBeInTheDocument()
  })
})

describe("Skeleton", () => {
  it("renders with correct base classes", () => {
    const { container } = render(<Skeleton />)
    const el = container.firstChild as HTMLElement
    expect(el).toBeInTheDocument()
    expect(el.tagName).toBe("DIV")
    expect(el.className).toContain("animate-pulse")
  })

  it("applies custom className", () => {
    const { container } = render(<Skeleton className="h-10 w-full" />)
    const el = container.firstChild as HTMLElement
    expect(el.classList.contains("h-10")).toBe(true)
    expect(el.classList.contains("w-full")).toBe(true)
  })
})
