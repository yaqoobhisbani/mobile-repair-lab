// @vitest-environment jsdom
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { CreateAccountForm } from "@/components/forms/create-account-form"

const mockMutate = vi.fn((_data, { onSuccess }: any) => onSuccess?.())

vi.mock("@/hooks/mutations/use-create-account", () => ({
  useCreateAccount: () => ({ mutate: mockMutate }),
}))

describe("CreateAccountForm", () => {
  const defaultProps = { onSuccess: vi.fn(), onCancel: vi.fn() }

  it("renders form fields", () => {
    render(<CreateAccountForm {...defaultProps} />)
    expect(screen.getByLabelText("Account Name *")).toBeInTheDocument()
    expect(screen.getByLabelText("Opening Balance (Rs.)")).toBeInTheDocument()
  })

  it("calls onCancel when cancel button is clicked", async () => {
    const onCancel = vi.fn()
    render(<CreateAccountForm onSuccess={vi.fn()} onCancel={onCancel} />)
    await userEvent.click(screen.getByText("Cancel"))
    expect(onCancel).toHaveBeenCalledOnce()
  })

  it("requires account name", () => {
    render(<CreateAccountForm {...defaultProps} />)
    const nameInput = screen.getByLabelText("Account Name *")
    expect(nameInput).toBeRequired()
  })

  it("renders Select trigger for account type", () => {
    render(<CreateAccountForm {...defaultProps} />)
    const selectTrigger = screen.getByText("Select type")
    expect(selectTrigger).toBeInTheDocument()
  })
})
