// @vitest-environment jsdom
import { render, screen } from "@testing-library/react"
import { Providers } from "@/components/providers"

vi.mock("next-themes", () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useTheme: () => ({ theme: "light", setTheme: vi.fn(), themes: ["light", "dark"] }),
}))

vi.mock("sonner", () => ({
  Toaster: () => null,
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() },
}))

describe("Providers", () => {
  it("renders children", () => {
    render(
      <Providers>
        <p>Child content</p>
      </Providers>,
    )
    expect(screen.getByText("Child content")).toBeInTheDocument()
  })
})
