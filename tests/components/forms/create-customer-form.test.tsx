// @vitest-environment jsdom
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { CreateCustomerForm } from "@/components/forms/create-customer-form"

vi.mock("@/hooks/mutations/use-create-customer", () => ({
  useCreateCustomer: () => ({ mutate: vi.fn(), isPending: false }),
}))

describe("CreateCustomerForm", () => {
  const defaultProps = { onSuccess: vi.fn(), onCancel: vi.fn() }

  it("renders form fields", () => {
    render(<CreateCustomerForm {...defaultProps} />)
    expect(screen.getByLabelText("Full Name *")).toBeInTheDocument()
    expect(screen.getByLabelText("Phone Number *")).toBeInTheDocument()
    expect(screen.getByLabelText("Email Address")).toBeInTheDocument()
  })

  it("requires name and phone", () => {
    render(<CreateCustomerForm {...defaultProps} />)
    expect(screen.getByLabelText("Full Name *")).toBeRequired()
    expect(screen.getByLabelText("Phone Number *")).toBeRequired()
  })

  it("calls onCancel when cancel is clicked", async () => {
    const onCancel = vi.fn()
    render(<CreateCustomerForm onSuccess={vi.fn()} onCancel={onCancel} />)
    await userEvent.click(screen.getByText("Cancel"))
    expect(onCancel).toHaveBeenCalledOnce()
  })
})
