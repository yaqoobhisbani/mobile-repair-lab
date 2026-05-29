// @vitest-environment jsdom
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { CreateTicketForm } from "@/components/forms/create-ticket-form"

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
  useCreateCustomer: () => ({
    mutateAsync: vi.fn().mockResolvedValue({ customer: { id: 1 } }),
    isPending: false,
  }),
}))

vi.mock("@/hooks/mutations/use-create-ticket", () => ({
  useCreateTicket: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
}))

describe("CreateTicketForm", () => {
  const defaultProps = { onSuccess: vi.fn(), onCancel: vi.fn() }

  it("renders customer section", () => {
    render(<CreateTicketForm {...defaultProps} />)
    expect(screen.getByText("Customer")).toBeInTheDocument()
  })

  it("renders customer mode toggle", () => {
    render(<CreateTicketForm {...defaultProps} />)
    expect(screen.getByText("Existing")).toBeInTheDocument()
    expect(screen.getByText("New")).toBeInTheDocument()
  })

  it("calls onCancel when cancel is clicked", async () => {
    const onCancel = vi.fn()
    render(<CreateTicketForm onSuccess={vi.fn()} onCancel={onCancel} />)
    await userEvent.click(screen.getByText("Cancel"))
    expect(onCancel).toHaveBeenCalledOnce()
  })
})
