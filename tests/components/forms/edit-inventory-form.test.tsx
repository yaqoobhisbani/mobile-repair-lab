// @vitest-environment jsdom
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { EditInventoryForm } from "@/components/forms/edit-inventory-form"

const mockItem = {
  id: 1,
  partName: "Screen",
  sku: "SCR-001",
  compatibility: "iPhone 13",
  stockQty: 10,
  lowStockThreshold: 3,
  costPrice: "2000",
  sellingPrice: "5000",
  accountId: null,
}

vi.mock("@/hooks/queries/use-inventory-item", () => ({
  useInventoryItem: () => ({ data: mockItem, isLoading: false }),
}))

vi.mock("@/hooks/mutations/use-update-inventory-item", () => ({
  useUpdateInventoryItem: () => ({ mutate: vi.fn(), isPending: false }),
}))

vi.mock("@/hooks/mutations/use-delete-inventory-item", () => ({
  useDeleteInventoryItem: () => ({ mutate: vi.fn(), isPending: false }),
}))

vi.mock("@/hooks/queries/use-accounts", () => ({
  useAccounts: () => ({ data: [], isLoading: false }),
}))

vi.mock("@/hooks/use-confirm", () => ({
  useConfirm: () => ({ confirm: vi.fn(), dialog: null }),
}))

describe("EditInventoryForm", () => {
  const defaultProps = { itemId: 1, onSuccess: vi.fn(), onCancel: vi.fn() }

  it("renders form with pre-filled values", () => {
    render(<EditInventoryForm {...defaultProps} />)
    expect(screen.getByDisplayValue("Screen")).toBeInTheDocument()
    expect(screen.getByDisplayValue("SCR-001")).toBeInTheDocument()
  })

  it("disables SKU field", () => {
    render(<EditInventoryForm {...defaultProps} />)
    expect(screen.getByDisplayValue("SCR-001")).toBeDisabled()
  })

  it("calls onCancel when cancel is clicked", async () => {
    const onCancel = vi.fn()
    render(<EditInventoryForm itemId={1} onSuccess={vi.fn()} onCancel={onCancel} />)
    await userEvent.click(screen.getByText("Cancel"))
    expect(onCancel).toHaveBeenCalledOnce()
  })
})
