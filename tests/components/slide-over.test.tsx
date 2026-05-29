// @vitest-environment jsdom
import { render, screen } from "@testing-library/react"
import { SlideOver } from "@/components/slide-over"

describe("SlideOver", () => {
  it("renders title and description when open", () => {
    render(
      <SlideOver open onOpenChange={() => {}} title="Add Part" description="Select a part to add.">
        Content
      </SlideOver>,
    )
    expect(screen.getByText("Add Part")).toBeInTheDocument()
    expect(screen.getByText("Select a part to add.")).toBeInTheDocument()
  })

  it("does not render when closed", () => {
    render(
      <SlideOver open={false} onOpenChange={() => {}} title="Hidden">
        Content
      </SlideOver>,
    )
    expect(screen.queryByText("Hidden")).not.toBeInTheDocument()
  })

  it("renders children when open", () => {
    render(
      <SlideOver open onOpenChange={() => {}} title="Slide">
        <p>Slide content</p>
      </SlideOver>,
    )
    expect(screen.getByText("Slide content")).toBeInTheDocument()
  })

  it("accepts gradient prop", () => {
    render(
      <SlideOver open onOpenChange={() => {}} title="Stock" gradient="inventory">
        Content
      </SlideOver>,
    )
    expect(screen.getByText("Stock")).toBeInTheDocument()
  })
})
