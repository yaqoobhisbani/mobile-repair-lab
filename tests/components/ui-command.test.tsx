// @vitest-environment jsdom
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command"

describe("Command", () => {
  it("renders input and group heading", () => {
    render(
      <Command>
        <CommandInput placeholder="Search..." />
        <CommandList>
          <CommandEmpty>No results</CommandEmpty>
          <CommandGroup heading="Fruits">
            <CommandItem>Apple</CommandItem>
            <CommandItem>Banana</CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>,
    )
    expect(screen.getByRole("combobox")).toBeInTheDocument()
    expect(screen.getByText("Fruits")).toBeInTheDocument()
  })

  it("shows empty state when no items match", async () => {
    render(
      <Command>
        <CommandInput placeholder="Search" />
        <CommandList>
          <CommandEmpty>No results found</CommandEmpty>
          <CommandGroup heading="Items">
            <CommandItem value="something">Something</CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>,
    )
    const input = screen.getByRole("combobox")
    await userEvent.type(input, "zzz")
    const empty = await screen.findByText("No results found")
    expect(empty).toBeInTheDocument()
  })
})
