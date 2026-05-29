import { describe, it, expect, beforeEach } from "vitest"
import { truncateAll } from "../helpers/db"
import { createCustomer, createPart } from "../helpers/fixtures"
import { mockRequest, mockGetRequest, mockParams } from "../helpers/api"

describe("Reports API", () => {
  beforeEach(async () => {
    await truncateAll()
  })

  it("returns profit report with completed tickets", async () => {
    const part = await createPart({
      stockQty: 10,
      costPrice: "30",
      sellingPrice: "100",
    })
    const customer = await createCustomer()
    const { POST } = await import("../../app/api/tickets/route")
    const createRes = await POST(
      mockRequest({
        customerId: customer.id,
        brand: "Apple",
        model: "iPhone 15",
        problemCategory: "Screen",
        laborCost: "50",
      })
    )
    const { ticket } = await createRes.json()
    const itemsPost = await import("../../app/api/tickets/[id]/items/route")
    await itemsPost.POST(
      mockRequest({ inventoryId: part.id, quantityUsed: 1 }),
      mockParams(ticket.id)
    )
    const ticketPut = await import("../../app/api/tickets/[id]/route")
    await ticketPut.PUT(mockRequest({ status: "completed" }), mockParams(ticket.id))
    const { GET } = await import("../../app/api/reports/profit/route")
    const res = await GET(mockGetRequest("http://localhost/?period=daily"))
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.data.length).toBeGreaterThanOrEqual(1)
    expect(data.summary.totalTickets).toBeGreaterThanOrEqual(1)
    expect(data.summary.totalProfit).toBeGreaterThan(0)
  })

  it("returns empty report when no completed tickets", async () => {
    const { GET } = await import("../../app/api/reports/profit/route")
    const res = await GET(mockGetRequest("http://localhost/?period=monthly"))
    const data = await res.json()
    expect(data.data).toEqual([])
    expect(data.summary.totalTickets).toBe(0)
  })

  it("rejects invalid period", async () => {
    const { GET } = await import("../../app/api/reports/profit/route")
    const res = await GET(mockGetRequest("http://localhost/?period=invalid"))
    expect(res.status).toBe(400)
  })
})
