// @vitest-environment jsdom
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { CreateInventoryForm } from "@/components/forms/create-inventory-form"

vi.mock("@/hooks/mutations/use-create-inventory-item", () => ({
  useCreateInventoryItem: () => ({ mutate: vi.fn() }),
}))

vi.mock("@/hooks/queries/use-accounts", () => ({
  useAccounts: () => ({ data: [], isLoading: false }),
}))

describe("CreateInventoryForm", () => {
  const defaultProps = { onSuccess: vi.fn(), onCancel: vi.fn() }

  it("renders form fields", () => {
    render(<CreateInventoryForm {...defaultProps} />)
    expect(screen.getByLabelText("Part Name *")).toBeInTheDocument()
    expect(screen.getByLabelText("SKU / Part ID *")).toBeInTheDocument()
    expect(screen.getByLabelText("Device Compatibility")).toBeInTheDocument()
    expect(screen.getByLabelText("Stock Quantity *")).toBeInTheDocument()
  })

  it("renders pricing fields", () => {
    render(<CreateInventoryForm {...defaultProps} />)
    expect(screen.getByLabelText("Cost Price (Rs.)")).toBeInTheDocument()
    expect(screen.getByLabelText("Selling Price (Rs.)")).toBeInTheDocument()
  })

  it("requires part name and SKU", () => {
    render(<CreateInventoryForm {...defaultProps} />)
    expect(screen.getByLabelText("Part Name *")).toBeRequired()
    expect(screen.getByLabelText("SKU / Part ID *")).toBeRequired()
  })

  it("calls onCancel when cancel is clicked", async () => {
    const onCancel = vi.fn()
    render(<CreateInventoryForm onSuccess={vi.fn()} onCancel={onCancel} />)
    await userEvent.click(screen.getByText("Cancel"))
    expect(onCancel).toHaveBeenCalledOnce()
  })

  it("renders section title", () => {
    render(<CreateInventoryForm {...defaultProps} />)
    expect(screen.getByText("Stock & Pricing")).toBeInTheDocument()
  })
})
