import { describe, it, expect, beforeEach } from "vitest"
import { truncateAll } from "../helpers/db"
import { createCustomer, createPart } from "../helpers/fixtures"
import { mockRequest, mockParams } from "../helpers/api"

describe("Ticket Items API", () => {
  let ticketId: string
  let part: { id: number; stockQty: number }

  beforeEach(async () => {
    await truncateAll()
    const customer = await createCustomer()
    const { POST } = await import("../../app/api/tickets/route")
    const res = await POST(
      mockRequest({
        customerId: customer.id,
        brand: "Apple",
        model: "iPhone 15",
        problemCategory: "Screen",
      })
    )
    const data = await res.json()
    ticketId = data.ticket.id
    part = await createPart({ stockQty: 10, costPrice: "50", sellingPrice: "100" })
  })

  describe("POST /api/tickets/[id]/items", () => {
    it("adds a part and deducts inventory stock", async () => {
      const { POST } = await import("../../app/api/tickets/[id]/items/route")
      const res = await POST(
        mockRequest({ inventoryId: part.id, quantityUsed: 3 }),
        mockParams(ticketId)
      )
      expect(res.status).toBe(201)
      const { db } = await import("@/db")
      const { inventory: invTable } = await import("../../db/schema")
      const { eq } = await import("drizzle-orm")
      const updatedPart = await db.select().from(invTable).where(eq(invTable.id, part.id)).limit(1)
      expect(updatedPart[0].stockQty).toBe(7)
    })

    it("increments quantity when same part added again", async () => {
      const itemsPost = await import("../../app/api/tickets/[id]/items/route")
      await itemsPost.POST(
        mockRequest({ inventoryId: part.id, quantityUsed: 2 }),
        mockParams(ticketId)
      )
      await itemsPost.POST(
        mockRequest({ inventoryId: part.id, quantityUsed: 3 }),
        mockParams(ticketId)
      )
      const { db } = await import("@/db")
      const { ticketItems } = await import("../../db/schema")
      const { eq, and } = await import("drizzle-orm")
      const items = await db
        .select()
        .from(ticketItems)
        .where(and(eq(ticketItems.ticketId, ticketId), eq(ticketItems.inventoryId, part.id)))
      expect(items.length).toBe(1)
      expect(items[0].quantityUsed).toBe(5)
      const { inventory: invTable } = await import("../../db/schema")
      const updatedPart = await db.select().from(invTable).where(eq(invTable.id, part.id)).limit(1)
      expect(updatedPart[0].stockQty).toBe(5)
    })

    it("rejects insufficient stock", async () => {
      const { POST } = await import("../../app/api/tickets/[id]/items/route")
      const res = await POST(
        mockRequest({ inventoryId: part.id, quantityUsed: 20 }),
        mockParams(ticketId)
      )
      expect(res.status).toBe(400)
    })
  })

  describe("DELETE /api/tickets/[id]/items", () => {
    it("removes a part and restores stock", async () => {
      const itemsPost = await import("../../app/api/tickets/[id]/items/route")
      const addRes = await itemsPost.POST(
        mockRequest({ inventoryId: part.id, quantityUsed: 4 }),
        mockParams(ticketId)
      )
      const { item } = await addRes.json()
      const delRes = await itemsPost.DELETE(
        mockRequest({ itemId: item.id }),
        mockParams(ticketId)
      )
      expect(delRes.status).toBe(200)
      const { db } = await import("@/db")
      const { inventory: invTable } = await import("../../db/schema")
      const { eq } = await import("drizzle-orm")
      const updatedPart = await db.select().from(invTable).where(eq(invTable.id, part.id)).limit(1)
      expect(updatedPart[0].stockQty).toBe(10)
    })
  })
})
