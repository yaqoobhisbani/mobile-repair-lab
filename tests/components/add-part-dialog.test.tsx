// @vitest-environment jsdom
import { render, screen, act } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { AddPartDialog } from "@/components/add-part-dialog"

vi.mock("@/lib/privacy-mode-context", () => ({
  usePrivacyMode: () => ({ privacyMode: false, toggle: vi.fn() }),
}))

const mockParts = [
  { id: 1, partName: "Screen", sku: "SCR-001", stockQty: 10, sellingPrice: "5000" },
  { id: 2, partName: "Battery", sku: "BAT-002", stockQty: 0, sellingPrice: "1500" },
]

vi.mock("@/hooks/queries/use-inventory", () => ({
  useInventory: () => ({ data: mockParts, isLoading: false }),
}))

vi.mock("@/hooks/mutations/use-add-part", () => ({
  useAddPart: () => ({ mutate: vi.fn() }),
}))

async function openDialog() {
  const dialogRoot = document.querySelector("[role='dialog']")
  if (dialogRoot) return dialogRoot
  await act(async () => {})
  return document.querySelector("[role='dialog']")
}

describe("AddPartDialog", () => {
  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
    ticketId: "TKT-001",
    onPartAdded: vi.fn(),
  }

  it("renders dialog title and description", async () => {
    render(<AddPartDialog {...defaultProps} />)
    const dialog = await screen.findByRole("dialog")
    expect(dialog).toBeInTheDocument()
    expect(await screen.findByText("Add Part")).toBeInTheDocument()
    expect(await screen.findByText("Select a part from inventory to add to this ticket.")).toBeInTheDocument()
  })

  it("renders inventory list in dialog", async () => {
    render(<AddPartDialog {...defaultProps} />)
    expect(await screen.findByText("Screen")).toBeInTheDocument()
    expect(await screen.findByText("Battery")).toBeInTheDocument()
  })

  it("disables Add button when no part selected", async () => {
    render(<AddPartDialog {...defaultProps} />)
    const addBtn = await screen.findByRole("button", { name: /add to ticket/i })
    expect(addBtn).toBeDisabled()
  })

  it("shows out of stock for zero stock parts", async () => {
    render(<AddPartDialog {...defaultProps} />)
    const stockZero = await screen.findByText("Stock: 0")
    expect(stockZero).toHaveClass("text-destructive")
  })
})
