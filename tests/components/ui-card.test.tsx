// @vitest-environment jsdom
import { render, screen } from "@testing-library/react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"

describe("Card", () => {
  it("renders card with default classes", () => {
    render(<Card>Card content</Card>)
    const card = screen.getByText("Card content")
    expect(card).toHaveClass("rounded-xl", "border", "bg-card")
  })

  it("renders with custom className", () => {
    render(<Card className="custom">Content</Card>)
    expect(screen.getByText("Content")).toHaveClass("custom")
  })
})

describe("CardHeader", () => {
  it("renders header with default classes", () => {
    render(<CardHeader>Header</CardHeader>)
    expect(screen.getByText("Header")).toHaveClass("flex", "flex-col", "p-6")
  })
})

describe("CardTitle", () => {
  it("renders title", () => {
    render(<CardTitle>My Title</CardTitle>)
    const title = screen.getByText("My Title")
    expect(title).toHaveClass("font-semibold", "leading-none", "tracking-tight")
  })
})

describe("CardDescription", () => {
  it("renders description with muted class", () => {
    render(<CardDescription>Description text</CardDescription>)
    expect(screen.getByText("Description text")).toHaveClass("text-sm", "text-muted-foreground")
  })
})

describe("CardContent", () => {
  it("renders content", () => {
    render(<CardContent>Content</CardContent>)
    expect(screen.getByText("Content")).toHaveClass("p-6", "pt-0")
  })
})

describe("CardFooter", () => {
  it("renders footer", () => {
    render(<CardFooter>Footer</CardFooter>)
    expect(screen.getByText("Footer")).toHaveClass("flex", "items-center", "p-6", "pt-0")
  })

  it("renders full card composition", () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Title</CardTitle>
          <CardDescription>Desc</CardDescription>
        </CardHeader>
        <CardContent>Body</CardContent>
        <CardFooter>Footer</CardFooter>
      </Card>,
    )
    expect(screen.getByText("Title")).toBeInTheDocument()
    expect(screen.getByText("Desc")).toBeInTheDocument()
    expect(screen.getByText("Body")).toBeInTheDocument()
    expect(screen.getByText("Footer")).toBeInTheDocument()
  })
})
