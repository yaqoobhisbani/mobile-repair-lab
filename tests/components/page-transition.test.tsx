// @vitest-environment jsdom
import { render, screen } from "@testing-library/react"
import { PageTransition, StaggerContainer, StaggerItem, HoverCard } from "@/components/page-transition"

vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: any) => {
      const { initial, animate, variants, whileHover, whileTap, ...rest } = props
      return <div {...rest}>{children}</div>
    },
  },
  useInView: () => true,
}))

describe("PageTransition", () => {
  it("renders children", () => {
    render(<PageTransition><p>Hello</p></PageTransition>)
    expect(screen.getByText("Hello")).toBeInTheDocument()
  })
})

describe("StaggerContainer", () => {
  it("renders children with className", () => {
    render(
      <StaggerContainer className="grid gap-4">
        <p>Item</p>
      </StaggerContainer>,
    )
    const item = screen.getByText("Item")
    expect(item).toBeInTheDocument()
    expect(item.parentElement).toHaveClass("grid", "gap-4")
  })
})

describe("StaggerItem", () => {
  it("renders children with className", () => {
    render(
      <StaggerItem className="p-4">
        <span>Content</span>
      </StaggerItem>,
    )
    expect(screen.getByText("Content")).toBeInTheDocument()
  })
})

describe("HoverCard", () => {
  it("renders children with className", () => {
    render(
      <HoverCard className="rounded-lg border p-4">
        <p>Card content</p>
      </HoverCard>,
    )
    expect(screen.getByText("Card content")).toBeInTheDocument()
  })
})
