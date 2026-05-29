// @vitest-environment jsdom
import { render, screen } from "@testing-library/react"
import { PrivacyAmount } from "@/components/privacy-amount"

vi.mock("@/lib/privacy-mode-context", () => ({
  usePrivacyMode: vi.fn(),
}))

import { usePrivacyMode } from "@/lib/privacy-mode-context"
const mockUsePrivacyMode = usePrivacyMode as unknown as ReturnType<typeof vi.fn>

describe("PrivacyAmount", () => {
  beforeEach(() => {
    mockUsePrivacyMode.mockReset()
  })

  it("renders children when privacy mode is off", () => {
    mockUsePrivacyMode.mockReturnValue({ privacyMode: false, toggle: vi.fn() })
    render(<PrivacyAmount>Rs. 1,000</PrivacyAmount>)
    expect(screen.getByText("Rs. 1,000")).toBeInTheDocument()
  })

  it("renders asterisks when privacy mode is on", () => {
    mockUsePrivacyMode.mockReturnValue({ privacyMode: true, toggle: vi.fn() })
    render(<PrivacyAmount>Rs. 1,000</PrivacyAmount>)
    expect(screen.getByText("***")).toBeInTheDocument()
    expect(screen.queryByText("Rs. 1,000")).not.toBeInTheDocument()
  })

  it("renders as div when as prop is div", () => {
    mockUsePrivacyMode.mockReturnValue({ privacyMode: false, toggle: vi.fn() })
    const { container } = render(
      <PrivacyAmount as="div" className="amount">
        Rs. 500
      </PrivacyAmount>,
    )
    const el = container.querySelector(".amount")
    expect(el?.tagName).toBe("DIV")
  })

  it("applies className to the rendered element", () => {
    mockUsePrivacyMode.mockReturnValue({ privacyMode: false, toggle: vi.fn() })
    render(
      <PrivacyAmount className="text-lg font-bold">Rs. 200</PrivacyAmount>,
    )
    expect(screen.getByText("Rs. 200")).toHaveClass("text-lg", "font-bold")
  })
})
