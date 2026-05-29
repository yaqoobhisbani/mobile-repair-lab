// @vitest-environment jsdom
import { render, screen } from "@testing-library/react"
import { DashboardSidebar } from "@/components/dashboard-sidebar"

vi.mock("@/lib/auth-context", () => ({
  useAuth: () => ({
    user: { id: 1, name: "John Doe", email: "john@example.com" },
    isLoading: false,
  }),
}))

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn(), forward: vi.fn(), refresh: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => "/dashboard",
  useSearchParams: () => new URLSearchParams(),
}))

vi.mock("@/hooks/queries/use-settings", () => ({
  useSettings: () => ({
    data: { shopName: "Test Shop", currency: "USD" },
    isLoading: false,
  }),
}))

describe("DashboardSidebar", () => {
  it("renders shop name", () => {
    render(<DashboardSidebar />)
    expect(screen.getByText("Test Shop")).toBeInTheDocument()
  })

  it("renders user name and email", () => {
    render(<DashboardSidebar />)
    expect(screen.getByText("John Doe")).toBeInTheDocument()
    expect(screen.getByText("john@example.com")).toBeInTheDocument()
  })

  it("renders nav items", () => {
    render(<DashboardSidebar />)
    expect(screen.getByText("Overview")).toBeInTheDocument()
    expect(screen.getByText("Tickets")).toBeInTheDocument()
    expect(screen.getByText("Sales")).toBeInTheDocument()
    expect(screen.getByText("Customers")).toBeInTheDocument()
    expect(screen.getByText("Inventory")).toBeInTheDocument()
    expect(screen.getByText("Reports")).toBeInTheDocument()
    expect(screen.getByText("Accounts")).toBeInTheDocument()
    expect(screen.getByText("Expenses")).toBeInTheDocument()
    expect(screen.getByText("Settings")).toBeInTheDocument()
  })

  it("renders section headers", () => {
    render(<DashboardSidebar />)
    expect(screen.getByText("Operations")).toBeInTheDocument()
    expect(screen.getByText("Finance")).toBeInTheDocument()
  })

  it("does not render close button (handled by Sheet)", () => {
    render(<DashboardSidebar onClose={() => {}} />)
    expect(screen.queryByRole("button")).not.toBeInTheDocument()
  })
})
