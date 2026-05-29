// @vitest-environment jsdom
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { EditAccountForm } from "@/components/forms/edit-account-form"

vi.mock("@/hooks/queries/use-account", () => ({
  useAccount: () => ({
    data: { id: 1, name: "Cash Account", type: "cash", description: "Main cash drawer" },
    isLoading: false,
  }),
}))

vi.mock("@/hooks/mutations/use-update-account", () => ({
  useUpdateAccount: () => ({ mutate: vi.fn() }),
}))

vi.mock("@/hooks/mutations/use-delete-account", () => ({
  useDeleteAccount: () => ({ mutate: vi.fn() }),
}))

vi.mock("@/hooks/use-confirm", () => ({
  useConfirm: () => ({ confirm: vi.fn(), dialog: null }),
}))

describe("EditAccountForm", () => {
  const defaultProps = { accountId: 1, onSuccess: vi.fn(), onCancel: vi.fn() }

  it("renders form with pre-filled values", () => {
    render(<EditAccountForm {...defaultProps} />)
    expect(screen.getByDisplayValue("Cash Account")).toBeInTheDocument()
  })

  it("renders delete button", () => {
    render(<EditAccountForm {...defaultProps} />)
    expect(screen.getByText("Delete")).toBeInTheDocument()
  })

  it("calls onCancel when cancel is clicked", async () => {
    const onCancel = vi.fn()
    render(<EditAccountForm accountId={1} onSuccess={vi.fn()} onCancel={onCancel} />)
    await userEvent.click(screen.getByText("Cancel"))
    expect(onCancel).toHaveBeenCalledOnce()
  })
})
