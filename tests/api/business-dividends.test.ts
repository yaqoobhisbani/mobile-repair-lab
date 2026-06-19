import { describe, it, expect, beforeEach } from "vitest"
import { truncateAll } from "../helpers/db"
import { createBusinessMember, createShareTransaction } from "../helpers/fixtures"
import { mockRequest, mockGetRequest } from "../helpers/api"

describe("Business Dividends API", () => {
  beforeEach(async () => {
    await truncateAll()
  })

  describe("POST /api/business/dividends", () => {
    it("distributes dividends proportionally to shareholders", async () => {
      const alice = await createBusinessMember({ name: "Alice" })
      const bob = await createBusinessMember({ name: "Bob" })

      await createShareTransaction({ buyerMemberId: alice.id, sharesCount: "60", totalAmount: "60000" })
      await createShareTransaction({ buyerMemberId: bob.id, sharesCount: "40", totalAmount: "40000" })

      const { POST } = await import("../../app/api/business/dividends/route")
      const res = await POST(mockRequest({ totalAmount: "50000", notes: "Q1 distribution" }))
      expect(res.status).toBe(201)
      const data = await res.json()
      expect(data.distributions).toHaveLength(2)

      const aliceDiv = data.distributions.find((d: any) => d.memberId === alice.id)
      const bobDiv = data.distributions.find((d: any) => d.memberId === bob.id)
      expect(aliceDiv).toBeDefined()
      expect(bobDiv).toBeDefined()
      expect(aliceDiv.shareholdingPercentage).toBe("60.00")
      expect(bobDiv.shareholdingPercentage).toBe("40.00")
    })

    it("rejects distribution when no shares exist", async () => {
      const { POST } = await import("../../app/api/business/dividends/route")
      const res = await POST(mockRequest({ totalAmount: "50000" }))
      expect(res.status).toBe(400)
      const data = await res.json()
      expect(data.error).toContain("No shares")
    })

    it("rejects zero or negative total amount", async () => {
      const { POST } = await import("../../app/api/business/dividends/route")
      const res1 = await POST(mockRequest({ totalAmount: "0" }))
      expect(res1.status).toBe(400)

      const res2 = await POST(mockRequest({ totalAmount: "-100" }))
      expect(res2.status).toBe(400)
    })
  })

  describe("GET /api/business/dividends", () => {
    it("lists all dividend distributions", async () => {
      const member = await createBusinessMember()
      await createShareTransaction({ buyerMemberId: member.id })

      const { db } = await import("@/db")
      const { dividendDistributions } = await import("../../db/schema")
      await db.insert(dividendDistributions).values({
        memberId: member.id,
        amount: "5000",
        shareholdingPercentage: "100.00",
      })

      const { GET } = await import("../../app/api/business/dividends/route")
      const res = await GET()
      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.distributions).toHaveLength(1)
      expect(data.distributions[0].memberName).toBe(member.name)
    })
  })
})
