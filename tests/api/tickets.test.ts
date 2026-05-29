import { describe, it, expect, beforeEach } from "vitest"
import { truncateAll } from "../helpers/db"
import { createCustomer, createAccount, createPart } from "../helpers/fixtures"
import { mockRequest, mockGetRequest, mockParams } from "../helpers/api"

describe("Tickets API", () => {
  beforeEach(async () => {
    await truncateAll()
  })

  describe("POST /api/tickets", () => {
    it("creates a ticket with received status", async () => {
      const customer = await createCustomer()
      const { POST } = await import("../../app/api/tickets/route")
      const res = await POST(
        mockRequest({
          customerId: customer.id,
          brand: "Samsung",
          model: "Galaxy S24",
          problemCategory: "Battery Replacement",
        })
      )
      expect(res.status).toBe(201)
      const data = await res.json()
      expect(data.ticket.id).toMatch(/^TKT-/)
      expect(data.ticket.status).toBe("received")
      expect(data.ticket.customerId).toBe(customer.id)
    })

    it("rejects missing required fields", async () => {
      const { POST } = await import("../../app/api/tickets/route")
      const res = await POST(mockRequest({ brand: "Apple" }))
      expect(res.status).toBe(400)
    })

    it("rejects non-existent customer", async () => {
      const { POST } = await import("../../app/api/tickets/route")
      const res = await POST(
        mockRequest({
          customerId: 99999,
          brand: "Apple",
          model: "iPhone",
          problemCategory: "Test",
        })
      )
      expect(res.status).toBe(404)
    })
  })

  describe("GET /api/tickets", () => {
    it("lists tickets with customer info", async () => {
      const customer = await createCustomer({ name: "Ticket Buyer" })
      const { POST } = await import("../../app/api/tickets/route")
      await POST(
        mockRequest({
          customerId: customer.id,
          brand: "Google",
          model: "Pixel 8",
          problemCategory: "Screen Repair",
        })
      )
      const { GET } = await import("../../app/api/tickets/route")
      const res = await GET(mockGetRequest())
      const data = await res.json()
      expect(data.tickets.length).toBe(1)
      expect(data.tickets[0].customerName).toBe("Ticket Buyer")
    })
  })

  describe("GET /api/tickets/[id]", () => {
    it("gets a ticket with items and status history", async () => {
      const customer = await createCustomer()
      const { POST } = await import("../../app/api/tickets/route")
      const createRes = await POST(
        mockRequest({
          customerId: customer.id,
          brand: "OnePlus",
          model: "12",
          problemCategory: "Camera",
        })
      )
      const { ticket } = await createRes.json()
      const { GET } = await import("../../app/api/tickets/[id]/route")
      const res = await GET(mockGetRequest(), mockParams(ticket.id))
      const data = await res.json()
      expect(data.ticket.id).toBe(ticket.id)
      expect(data.statusHistory.length).toBe(1)
      expect(data.statusHistory[0].status).toBe("received")
    })

    it("returns 404 for non-existent ticket", async () => {
      const { GET } = await import("../../app/api/tickets/[id]/route")
      const res = await GET(mockGetRequest(), mockParams("TKT-NONEXIST"))
      expect(res.status).toBe(404)
    })
  })

  describe("PUT /api/tickets/[id]", () => {
    it("updates ticket status and records history", async () => {
      const customer = await createCustomer()
      const { POST } = await import("../../app/api/tickets/route")
      const createRes = await POST(
        mockRequest({
          customerId: customer.id,
          brand: "Apple",
          model: "iPhone 15",
          problemCategory: "Screen",
        })
      )
      const { ticket } = await createRes.json()
      const { PUT } = await import("../../app/api/tickets/[id]/route")
      const res = await PUT(
        mockRequest({ status: "diagnosing" }),
        mockParams(ticket.id)
      )
      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.ticket.status).toBe("diagnosing")
    })

    it("processes payment and credits account", async () => {
      const customer = await createCustomer()
      const account = await createAccount({ balance: "0" })
      const part = await createPart({ stockQty: 10, sellingPrice: "250", costPrice: "100" })
      const { POST } = await import("../../app/api/tickets/route")
      const createRes = await POST(
        mockRequest({
          customerId: customer.id,
          brand: "Apple",
          model: "iPhone 15",
          problemCategory: "Screen",
          laborCost: "0",
        })
      )
      const { ticket } = await createRes.json()
      const itemsPost = await import("../../app/api/tickets/[id]/items/route")
      await itemsPost.POST(
        mockRequest({ inventoryId: part.id, quantityUsed: 2 }),
        mockParams(ticket.id)
      )
      const { PUT } = await import("../../app/api/tickets/[id]/route")
      const res = await PUT(
        mockRequest({
          paymentAccountId: account.id,
          paymentStatus: "paid",
        }),
        mockParams(ticket.id)
      )
      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.ticket.paymentStatus).toBe("paid")
      expect(parseFloat(data.ticket.amountPaid)).toBeGreaterThan(0)
    })
  })

  describe("DELETE /api/tickets/[id]", () => {
    it("deletes ticket and restores stock and reverses payment", async () => {
      const customer = await createCustomer()
      const account = await createAccount({ balance: "1000" })
      const part = await createPart({ stockQty: 10, sellingPrice: "100", costPrice: "50" })
      const { POST } = await import("../../app/api/tickets/route")
      const createRes = await POST(
        mockRequest({
          customerId: customer.id,
          brand: "Apple",
          model: "iPhone 15",
          problemCategory: "Screen",
        })
      )
      const { ticket } = await createRes.json()
      const itemsPost = await import("../../app/api/tickets/[id]/items/route")
      await itemsPost.POST(
        mockRequest({ inventoryId: part.id, quantityUsed: 2 }),
        mockParams(ticket.id)
      )
      const { PUT } = await import("../../app/api/tickets/[id]/route")
      await PUT(
        mockRequest({ paymentAccountId: account.id, paymentStatus: "paid" }),
        mockParams(ticket.id)
      )
      const { db } = await import("@/db")
      const { inventory: invTable, accounts: accTable } = await import("../../db/schema")
      const { eq } = await import("drizzle-orm")
      const beforePart = await db.select().from(invTable).where(eq(invTable.id, part.id)).limit(1)
      expect(beforePart[0].stockQty).toBe(8)
      const { DELETE } = await import("../../app/api/tickets/[id]/route")
      const delRes = await DELETE(mockGetRequest(), mockParams(ticket.id))
      expect(delRes.status).toBe(200)
      const afterPart = await db.select().from(invTable).where(eq(invTable.id, part.id)).limit(1)
      expect(afterPart[0].stockQty).toBe(10)
      const afterAcc = await db.select().from(accTable).where(eq(accTable.id, account.id)).limit(1)
      expect(parseFloat(afterAcc[0].balance)).toBe(1000)
    })
  })
})
