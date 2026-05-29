// @vitest-environment jsdom
import { render, screen } from "@testing-library/react"
import { DashboardHeader } from "@/components/dashboard-header"

vi.mock("@/lib/auth-context", () => ({
  useAuth: () => ({
    user: { id: 1, name: "John Doe", email: "john@example.com" },
    isLoading: false,
    logout: vi.fn(),
  }),
}))

vi.mock("@/lib/privacy-mode-context", () => ({
  usePrivacyMode: () => ({ privacyMode: false, toggle: vi.fn() }),
}))

vi.mock("@tanstack/react-query", () => ({
  useQuery: () => ({ data: undefined, isLoading: false }),
}))

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn(), forward: vi.fn(), refresh: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => "/dashboard",
  useSearchParams: () => new URLSearchParams(),
}))

vi.mock("next-themes", () => ({
  useTheme: () => ({ theme: "light", setTheme: vi.fn(), themes: ["light", "dark"] }),
}))

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

describe("DashboardHeader", () => {
  it("renders breadcrumbs", () => {
    render(<DashboardHeader />)
    expect(screen.getByText("Dashboard")).toBeInTheDocument()
  })

  it("renders theme toggle button", () => {
    render(<DashboardHeader />)
    const themeBtn = screen.getByTitle("Dark Mode")
    expect(themeBtn).toBeInTheDocument()
  })

  it("renders search button", () => {
    render(<DashboardHeader />)
    const searchBtn = screen.getByTitle("Search (Cmd+K)")
    expect(searchBtn).toBeInTheDocument()
  })

  it("renders user avatar with initial", () => {
    render(<DashboardHeader />)
    expect(screen.getByText("J")).toBeInTheDocument()
  })
})
