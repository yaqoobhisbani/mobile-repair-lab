// @vitest-environment jsdom
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { CreateSaleForm } from "@/components/forms/create-sale-form"

vi.mock("@/lib/privacy-mode-context", () => ({
  usePrivacyMode: () => ({ privacyMode: false, toggle: vi.fn() }),
}))

vi.mock("@/hooks/queries/use-inventory", () => ({
  useInventory: () => ({
    data: [
      { id: 1, partName: "Screen", sku: "SCR-001", stockQty: 10, sellingPrice: "5000" },
      { id: 2, partName: "Battery", sku: "BAT-002", stockQty: 5, sellingPrice: "1500" },
    ],
    isLoading: false,
  }),
}))

vi.mock("@/hooks/queries/use-accounts", () => ({
  useAccounts: () => ({
    data: [{ id: 1, name: "Cash", type: "cash", balance: "50000" }],
    isLoading: false,
  }),
}))

vi.mock("@/hooks/queries/use-customers", () => ({
  useCustomers: () => ({
    data: [
      { id: 1, name: "Alice", phone: "+123", email: null },
      { id: 2, name: "Bob", phone: "+456", email: "bob@test.com" },
    ],
    isLoading: false,
  }),
}))

vi.mock("@/hooks/mutations/use-create-customer", () => ({
  useCreateCustomer: () => ({ mutateAsync: vi.fn().mockResolvedValue({ customer: { id: 99 } }) }),
}))

const mockCreateSale = vi.fn()
vi.mock("@/hooks/mutations/use-create-sale", () => ({
  useCreateSale: () => ({ mutateAsync: mockCreateSale }),
}))

describe("CreateSaleForm", () => {
  const defaultProps = { onSuccess: vi.fn(), onCancel: vi.fn() }

  it("renders customer section", () => {
    render(<CreateSaleForm {...defaultProps} />)
    expect(screen.getByText("Customer")).toBeInTheDocument()
  })

  it("renders customer mode toggle buttons", () => {
    render(<CreateSaleForm {...defaultProps} />)
    expect(screen.getByText("Existing")).toBeInTheDocument()
    expect(screen.getByText("New")).toBeInTheDocument()
  })

  it("switches to new customer mode", async () => {
    render(<CreateSaleForm {...defaultProps} />)
    await userEvent.click(screen.getByText("New"))
    expect(screen.getByLabelText("Full Name")).toBeInTheDocument()
    expect(screen.getByLabelText("Phone")).toBeInTheDocument()
    expect(screen.getByLabelText("Email")).toBeInTheDocument()
  })

  it("calls onCancel when cancel is clicked", async () => {
    const onCancel = vi.fn()
    render(<CreateSaleForm onSuccess={vi.fn()} onCancel={onCancel} />)
    await userEvent.click(screen.getByText("Cancel"))
    expect(onCancel).toHaveBeenCalledOnce()
  })
})
