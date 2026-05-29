// @vitest-environment jsdom
import { render, screen } from "@testing-library/react"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"

describe("Avatar", () => {
  it("renders fallback when no image", () => {
    render(
      <Avatar>
        <AvatarFallback>JD</AvatarFallback>
      </Avatar>,
    )
    expect(screen.getByText("JD")).toBeInTheDocument()
  })

  it("renders fallback alongside image", () => {
    render(
      <Avatar>
        <AvatarImage src="/photo.jpg" alt="User" />
        <AvatarFallback>JD</AvatarFallback>
      </Avatar>,
    )
    expect(screen.getByText("JD")).toBeInTheDocument()
  })

  it("applies custom className to root", () => {
    const { container } = render(
      <Avatar className="custom-avatar">
        <AvatarFallback>AB</AvatarFallback>
      </Avatar>,
    )
    const root = container.firstChild as HTMLElement
    expect(root).toHaveClass("custom-avatar")
  })
})
