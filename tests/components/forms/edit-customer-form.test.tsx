// @vitest-environment jsdom
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { EditCustomerForm } from "@/components/forms/edit-customer-form"

vi.mock("@/hooks/queries/use-customer", () => ({
  useCustomer: () => ({
    data: { id: 1, name: "Alice Smith", phone: "+1234567890", email: "alice@example.com" },
    isLoading: false,
  }),
}))

vi.mock("@/hooks/mutations/use-update-customer", () => ({
  useUpdateCustomer: () => ({ mutate: vi.fn() }),
}))

vi.mock("@/hooks/mutations/use-delete-customer", () => ({
  useDeleteCustomer: () => ({ mutate: vi.fn() }),
}))

vi.mock("@/hooks/use-confirm", () => ({
  useConfirm: () => ({ confirm: vi.fn(), dialog: null }),
}))

describe("EditCustomerForm", () => {
  const defaultProps = { customerId: 1, onSuccess: vi.fn(), onCancel: vi.fn() }

  it("renders form with pre-filled values", () => {
    render(<EditCustomerForm {...defaultProps} />)
    expect(screen.getByDisplayValue("Alice Smith")).toBeInTheDocument()
    expect(screen.getByDisplayValue("+1234567890")).toBeInTheDocument()
  })

  it("renders delete button", () => {
    render(<EditCustomerForm {...defaultProps} />)
    expect(screen.getByText("Delete")).toBeInTheDocument()
  })

  it("calls onCancel when cancel is clicked", async () => {
    const onCancel = vi.fn()
    render(<EditCustomerForm customerId={1} onSuccess={vi.fn()} onCancel={onCancel} />)
    await userEvent.click(screen.getByText("Cancel"))
    expect(onCancel).toHaveBeenCalledOnce()
  })
})
