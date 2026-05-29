// @vitest-environment jsdom
import { render, screen } from "@testing-library/react"
import { EmptyState } from "@/components/empty-state"
import { Package } from "lucide-react"

describe("EmptyState", () => {
  it("renders icon, title, and description", () => {
    render(<EmptyState icon={Package} title="No items" description="There are no items to display." />)
    expect(screen.getByText("No items")).toBeInTheDocument()
    expect(screen.getByText("There are no items to display.")).toBeInTheDocument()
  })

  it("renders action when provided", () => {
    render(
      <EmptyState
        icon={Package}
        title="Empty"
        description="Nothing here"
        action={<button>Add Item</button>}
      />,
    )
    expect(screen.getByRole("button", { name: /add item/i })).toBeInTheDocument()
  })

  it("does not render action div when not provided", () => {
    const { container } = render(
      <EmptyState icon={Package} title="Empty" description="No action" />,
    )
    const actionDiv = container.querySelector("div.mt-4")
    expect(actionDiv).not.toBeInTheDocument()
  })
})
