// @vitest-environment jsdom
import { render, screen } from "@testing-library/react"
import { AnimatedCounter } from "@/components/animated-counter"

vi.mock("framer-motion", () => ({
  useInView: () => true,
}))

describe("AnimatedCounter", () => {
  it("renders initial value", () => {
    render(<AnimatedCounter to={100} />)
    expect(screen.getByText("0")).toBeInTheDocument()
  })

  it("renders with prefix and suffix", () => {
    render(<AnimatedCounter to={50} prefix="$" suffix="K" />)
    const span = screen.getByText(/\$0K/)
    expect(span).toBeInTheDocument()
  })

  it("applies className", () => {
    render(<AnimatedCounter to={10} className="text-2xl font-bold" />)
    expect(screen.getByText("0")).toHaveClass("text-2xl", "font-bold")
  })

  it("renders with custom from value", () => {
    render(<AnimatedCounter from={10} to={100} />)
    expect(screen.getByText("10")).toBeInTheDocument()
  })
})
