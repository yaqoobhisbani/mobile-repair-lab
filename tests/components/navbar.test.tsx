// @vitest-environment jsdom
import { render, screen } from "@testing-library/react"
import { Navbar } from "@/components/navbar"

describe("Navbar", () => {
  it("renders shop name", () => {
    render(<Navbar />)
    expect(screen.getByText("Mobile Repair Lab")).toBeInTheDocument()
  })

  it("renders MRL logo", () => {
    render(<Navbar />)
    expect(screen.getByText("MRL")).toBeInTheDocument()
  })

  it("renders Track Repair link", () => {
    render(<Navbar />)
    const trackLink = screen.getByText("Track Repair")
    expect(trackLink).toBeInTheDocument()
    expect(trackLink.closest("a")).toHaveAttribute("href", "/track")
  })

  it("renders Dashboard link with button", () => {
    render(<Navbar />)
    const dashboardLink = screen.getByText("Dashboard")
    expect(dashboardLink).toBeInTheDocument()
    expect(dashboardLink.closest("a")).toHaveAttribute("href", "/dashboard")
  })
})
