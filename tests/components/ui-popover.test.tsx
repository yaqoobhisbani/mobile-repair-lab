// @vitest-environment jsdom
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"

describe("Popover", () => {
  it("renders trigger and opens content", async () => {
    render(
      <Popover>
        <PopoverTrigger>Open</PopoverTrigger>
        <PopoverContent>Popover content</PopoverContent>
      </Popover>,
    )
    expect(screen.queryByText("Popover content")).not.toBeInTheDocument()
    await userEvent.click(screen.getByText("Open"))
    expect(screen.getByText("Popover content")).toBeInTheDocument()
  })

  it("applies custom className to content", async () => {
    render(
      <Popover>
        <PopoverTrigger>Click</PopoverTrigger>
        <PopoverContent className="custom-popover">Content</PopoverContent>
      </Popover>,
    )
    await userEvent.click(screen.getByText("Click"))
    expect(screen.getByText("Content")).toHaveClass("custom-popover")
  })
})
