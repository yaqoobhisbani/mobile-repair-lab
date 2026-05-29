import { describe, it, expect, beforeEach } from "vitest"
import { truncateAll } from "../helpers/db"
import { createCustomer } from "../helpers/fixtures"
import { mockRequest, mockGetRequest, mockParams } from "../helpers/api"

describe("Customers API", () => {
  beforeEach(async () => {
    await truncateAll()
  })

  describe("POST /api/customers", () => {
    it("creates a customer", async () => {
      const { POST } = await import("../../app/api/customers/route")
      const res = await POST(mockRequest({ name: "John Doe", phone: "555-1234", email: "john@test.com" }))
      expect(res.status).toBe(201)
      const data = await res.json()
      expect(data.customer.name).toBe("John Doe")
      expect(data.customer.phone).toBe("555-1234")
      expect(data.customer.email).toBe("john@test.com")
    })

    it("rejects missing name and phone", async () => {
      const { POST } = await import("../../app/api/customers/route")
      const res = await POST(mockRequest({}))
      expect(res.status).toBe(400)
    })

    it("creates customer without email", async () => {
      const { POST } = await import("../../app/api/customers/route")
      const res = await POST(mockRequest({ name: "No Email", phone: "555-0000" }))
      expect(res.status).toBe(201)
      const data = await res.json()
      expect(data.customer.email).toBeNull()
    })
  })

  describe("GET /api/customers", () => {
    it("lists customers", async () => {
      await createCustomer({ name: "Alice" })
      await createCustomer({ name: "Bob" })
      const { GET } = await import("../../app/api/customers/route")
      const res = await GET(mockGetRequest())
      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.customers.length).toBe(2)
    })

    it("searches customers by name", async () => {
      await createCustomer({ name: "Alice Wonderland", phone: "555-1111" })
      await createCustomer({ name: "Bob Builder", phone: "555-2222" })
      const { GET } = await import("../../app/api/customers/route")
      const res = await GET(mockGetRequest("http://localhost/?search=Alice"))
      const data = await res.json()
      expect(data.customers.length).toBe(1)
      expect(data.customers[0].name).toBe("Alice Wonderland")
    })
  })

  describe("GET /api/customers/[id]", () => {
    it("gets a customer by id", async () => {
      const customer = await createCustomer()
      const { GET } = await import("../../app/api/customers/[id]/route")
      const res = await GET(mockGetRequest(), mockParams(String(customer.id)))
      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.customer.id).toBe(customer.id)
    })

    it("returns 404 for non-existent customer", async () => {
      const { GET } = await import("../../app/api/customers/[id]/route")
      const res = await GET(mockGetRequest(), mockParams("99999"))
      expect(res.status).toBe(404)
    })
  })

  describe("PUT /api/customers/[id]", () => {
    it("updates a customer", async () => {
      const customer = await createCustomer({ name: "Old Name" })
      const { PUT } = await import("../../app/api/customers/[id]/route")
      const res = await PUT(mockRequest({ name: "New Name" }), mockParams(String(customer.id)))
      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.customer.name).toBe("New Name")
    })
  })

  describe("DELETE /api/customers/[id]", () => {
    it("deletes a customer with no references", async () => {
      const customer = await createCustomer()
      const { DELETE } = await import("../../app/api/customers/[id]/route")
      const res = await DELETE(mockGetRequest(), mockParams(String(customer.id)))
      expect(res.status).toBe(200)
    })

    it("prevents deleting customer with tickets", async () => {
      const customer = await createCustomer()
      const { db } = await import("@/db")
      const { tickets } = await import("../../db/schema")
      await db.insert(tickets).values({
        id: "TKT-001",
        customerId: customer.id,
        brand: "Apple",
        model: "iPhone",
        problemCategory: "Test",
      })
      const { DELETE } = await import("../../app/api/customers/[id]/route")
      const res = await DELETE(mockGetRequest(), mockParams(String(customer.id)))
      expect(res.status).toBe(400)
      const data = await res.json()
      expect(data.error).toContain("ticket")
    })
  })
})
