// @vitest-environment jsdom
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { DataTablePagination } from "@/components/data-table-pagination"

describe("DataTablePagination", () => {
  const defaultProps = {
    currentPage: 1,
    totalPages: 5,
    totalItems: 50,
    pageSize: 10,
    onPageChange: vi.fn(),
  }

  it("renders pagination info", () => {
    render(<DataTablePagination {...defaultProps} />)
    expect(screen.getByText(/Showing 1–10 of 50/)).toBeInTheDocument()
  })

  it("renders correct range for last page", () => {
    render(<DataTablePagination {...defaultProps} currentPage={5} />)
    expect(screen.getByText(/Showing 41–50 of 50/)).toBeInTheDocument()
  })

  it("renders zero state", () => {
    render(<DataTablePagination {...defaultProps} totalItems={0} currentPage={1} />)
    expect(screen.getByText(/Showing 0–0 of 0/)).toBeInTheDocument()
  })

  it("renders page buttons", () => {
    render(<DataTablePagination {...defaultProps} />)
    expect(screen.getByText("1")).toBeInTheDocument()
    expect(screen.getByText("5")).toBeInTheDocument()
  })

  it("calls onPageChange when next is clicked", async () => {
    const onPageChange = vi.fn()
    render(<DataTablePagination {...defaultProps} onPageChange={onPageChange} />)
    const buttons = screen.getAllByRole("button")
    const nextBtn = buttons[buttons.length - 1]
    await userEvent.click(nextBtn)
    expect(onPageChange).toHaveBeenCalledWith(2)
  })

  it("disables prev button on first page", () => {
    render(<DataTablePagination {...defaultProps} currentPage={1} />)
    const buttons = screen.getAllByRole("button")
    const prevBtn = buttons[0]
    expect(prevBtn).toBeDisabled()
  })

  it("disables next button on last page", () => {
    render(<DataTablePagination {...defaultProps} currentPage={5} totalPages={5} />)
    const buttons = screen.getAllByRole("button")
    const nextBtn = buttons[buttons.length - 1]
    expect(nextBtn).toBeDisabled()
  })

  it("renders page size selector when onPageSizeChange is provided", () => {
    render(<DataTablePagination {...defaultProps} onPageSizeChange={vi.fn()} />)
    expect(screen.getByText("per page:")).toBeInTheDocument()
  })

  it("shows ellipsis for large page counts", () => {
    render(<DataTablePagination {...defaultProps} totalPages={10} />)
    const ellipsis = screen.getAllByText("…")
    expect(ellipsis.length).toBeGreaterThan(0)
  })
})
