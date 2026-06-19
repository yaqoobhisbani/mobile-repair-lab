import { describe, it, expect, beforeEach } from "vitest"
import { truncateAll } from "../helpers/db"
import { createBusinessMember } from "../helpers/fixtures"
import { mockRequest, mockGetRequest, mockParams } from "../helpers/api"

describe("Business Members API", () => {
  beforeEach(async () => {
    await truncateAll()
  })

  describe("POST /api/business/members", () => {
    it("creates a member", async () => {
      const { POST } = await import("../../app/api/business/members/route")
      const res = await POST(mockRequest({ name: "Alice", email: "alice@test.com", phone: "555-1111", role: "owner" }))
      expect(res.status).toBe(201)
      const data = await res.json()
      expect(data.member.name).toBe("Alice")
      expect(data.member.email).toBe("alice@test.com")
      expect(data.member.role).toBe("owner")
    })

    it("defaults role to partner", async () => {
      const { POST } = await import("../../app/api/business/members/route")
      const res = await POST(mockRequest({ name: "Bob" }))
      expect(res.status).toBe(201)
      const data = await res.json()
      expect(data.member.role).toBe("partner")
    })

    it("rejects missing name", async () => {
      const { POST } = await import("../../app/api/business/members/route")
      const res = await POST(mockRequest({ email: "no@name.com" }))
      expect(res.status).toBe(400)
    })
  })

  describe("GET /api/business/members", () => {
    it("lists all members with share balances", async () => {
      await createBusinessMember({ name: "Alice" })
      await createBusinessMember({ name: "Bob" })
      const { GET } = await import("../../app/api/business/members/route")
      const res = await GET()
      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.members).toHaveLength(2)
      expect(data.members[0].sharesOwned).toBeDefined()
    })
  })

  describe("GET /api/business/members/[id]", () => {
    it("returns member with portfolio", async () => {
      const member = await createBusinessMember()
      const { GET } = await import("../../app/api/business/members/[id]/route")
      const res = await GET(mockGetRequest(), mockParams(String(member.id)))
      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.member.id).toBe(member.id)
      expect(data.sharesOwned).toBeDefined()
      expect(data.transactions).toBeDefined()
      expect(data.assets).toBeDefined()
      expect(data.dividends).toBeDefined()
    })

    it("returns 404 for non-existent member", async () => {
      const { GET } = await import("../../app/api/business/members/[id]/route")
      const res = await GET(mockGetRequest(), mockParams("99999"))
      expect(res.status).toBe(404)
    })
  })

  describe("PUT /api/business/members/[id]", () => {
    it("updates a member", async () => {
      const member = await createBusinessMember({ name: "Old Name", role: "investor" })
      const { PUT } = await import("../../app/api/business/members/[id]/route")
      const res = await PUT(mockRequest({ name: "New Name", role: "partner" }), mockParams(String(member.id)))
      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.member.name).toBe("New Name")
      expect(data.member.role).toBe("partner")
    })
  })

  describe("DELETE /api/business/members/[id]", () => {
    it("deletes a member with no shares or assets", async () => {
      const member = await createBusinessMember()
      const { DELETE } = await import("../../app/api/business/members/[id]/route")
      const res = await DELETE(mockGetRequest(), mockParams(String(member.id)))
      expect(res.status).toBe(200)
    })

    it("blocks deletion if member has share transactions", async () => {
      const member = await createBusinessMember()
      const { db } = await import("@/db")
      const { shareTransactions } = await import("../../db/schema")
      await db.insert(shareTransactions).values({
        transactionType: "initial_issuance",
        buyerMemberId: member.id,
        sharesCount: "10",
        pricePerShare: "1000",
        totalAmount: "10000",
      })
      const { DELETE } = await import("../../app/api/business/members/[id]/route")
      const res = await DELETE(mockGetRequest(), mockParams(String(member.id)))
      expect(res.status).toBe(400)
      const data = await res.json()
      expect(data.error).toContain("share")
    })

    it("blocks deletion if member owns assets", async () => {
      const member = await createBusinessMember()
      const { db } = await import("@/db")
      const { businessAssets } = await import("../../db/schema")
      await db.insert(businessAssets).values({
        name: "Test Asset",
        costPrice: "50000",
        purchasedByMemberId: member.id,
        fundingSource: "member_equity",
      })
      const { DELETE } = await import("../../app/api/business/members/[id]/route")
      const res = await DELETE(mockGetRequest(), mockParams(String(member.id)))
      expect(res.status).toBe(400)
      const data = await res.json()
      expect(data.error).toContain("asset")
    })
  })
})
