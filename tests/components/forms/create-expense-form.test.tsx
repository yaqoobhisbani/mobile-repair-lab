// @vitest-environment jsdom
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { CreateExpenseForm } from "@/components/forms/create-expense-form"

vi.mock("@/hooks/queries/use-accounts", () => ({
  useAccounts: () => ({
    data: [
      { id: 1, name: "Cash", type: "cash", balance: "50000" },
      { id: 2, name: "Bank", type: "bank", balance: "100000" },
    ],
    isLoading: false,
  }),
}))

const mockMutate = vi.fn()
vi.mock("@/hooks/mutations/use-create-expense", () => ({
  useCreateExpense: () => ({ mutate: mockMutate }),
}))

describe("CreateExpenseForm", () => {
  const defaultProps = { onSuccess: vi.fn(), onCancel: vi.fn() }

  it("renders form fields", () => {
    render(<CreateExpenseForm {...defaultProps} />)
    expect(screen.getByLabelText("Description *")).toBeInTheDocument()
    expect(screen.getByLabelText("Amount (Rs.) *")).toBeInTheDocument()
  })

  it("requires description and amount", () => {
    render(<CreateExpenseForm {...defaultProps} />)
    expect(screen.getByLabelText("Description *")).toBeRequired()
    expect(screen.getByLabelText("Amount (Rs.) *")).toBeRequired()
  })

  it("renders date picker", () => {
    render(<CreateExpenseForm {...defaultProps} />)
    expect(screen.getByText("Date")).toBeInTheDocument()
  })

  it("calls onCancel when cancel is clicked", async () => {
    const onCancel = vi.fn()
    render(<CreateExpenseForm onSuccess={vi.fn()} onCancel={onCancel} />)
    await userEvent.click(screen.getByText("Cancel"))
    expect(onCancel).toHaveBeenCalledOnce()
  })

  it("renders account selector", () => {
    render(<CreateExpenseForm {...defaultProps} />)
    expect(screen.getByText("Account *")).toBeInTheDocument()
  })
})
