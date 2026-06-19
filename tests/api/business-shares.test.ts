import { describe, it, expect, beforeEach } from "vitest"
import { truncateAll } from "../helpers/db"
import { createBusinessMember, createShareTransaction } from "../helpers/fixtures"
import { mockRequest, mockGetRequest } from "../helpers/api"

describe("Business Shares API", () => {
  beforeEach(async () => {
    await truncateAll()
  })

  describe("POST /api/business/shares", () => {
    it("creates an initial share issuance", async () => {
      const member = await createBusinessMember()
      const { POST } = await import("../../app/api/business/shares/route")
      const res = await POST(mockRequest({
        transactionType: "initial_issuance",
        buyerMemberId: member.id,
        sharesCount: "100",
        pricePerShare: "1000",
      }))
      expect(res.status).toBe(201)
      const data = await res.json()
      expect(data.transaction.transactionType).toBe("initial_issuance")
      expect(data.transaction.sharesCount).toBe("100.00")
      expect(data.transaction.totalAmount).toBe("100000.00")
    })

    it("transfers shares between members", async () => {
      const seller = await createBusinessMember({ name: "Seller" })
      const buyer = await createBusinessMember({ name: "Buyer" })
      await createShareTransaction({ buyerMemberId: seller.id, sharesCount: "50", totalAmount: "50000" })

      const { POST } = await import("../../app/api/business/shares/route")
      const res = await POST(mockRequest({
        transactionType: "internal_transfer",
        sellerMemberId: seller.id,
        buyerMemberId: buyer.id,
        sharesCount: "20",
        pricePerShare: "1000",
      }))
      expect(res.status).toBe(201)
      const data = await res.json()
      expect(data.transaction.transactionType).toBe("internal_transfer")
      expect(data.transaction.sharesCount).toBe("20.00")
    })

    it("rejects transfer with insufficient shares", async () => {
      const seller = await createBusinessMember({ name: "Poor Seller" })
      const buyer = await createBusinessMember({ name: "Buyer" })
      await createShareTransaction({ buyerMemberId: seller.id, sharesCount: "10", totalAmount: "10000" })

      const { POST } = await import("../../app/api/business/shares/route")
      const res = await POST(mockRequest({
        transactionType: "internal_transfer",
        sellerMemberId: seller.id,
        buyerMemberId: buyer.id,
        sharesCount: "50",
      }))
      expect(res.status).toBe(400)
      const data = await res.json()
      expect(data.error).toContain("Insufficient")
    })

    it("rejects zero or negative shares", async () => {
      const member = await createBusinessMember()
      const { POST } = await import("../../app/api/business/shares/route")
      const res1 = await POST(mockRequest({
        transactionType: "initial_issuance",
        buyerMemberId: member.id,
        sharesCount: "0",
      }))
      expect(res1.status).toBe(400)

      const res2 = await POST(mockRequest({
        transactionType: "initial_issuance",
        buyerMemberId: member.id,
        sharesCount: "-5",
      }))
      expect(res2.status).toBe(400)
    })

    it("rejects initial issuance with a seller", async () => {
      const member = await createBusinessMember()
      const { POST } = await import("../../app/api/business/shares/route")
      const res = await POST(mockRequest({
        transactionType: "initial_issuance",
        sellerMemberId: member.id,
        buyerMemberId: member.id,
        sharesCount: "10",
      }))
      expect(res.status).toBe(400)
    })

    it("rejects transfer without both seller and buyer", async () => {
      const member = await createBusinessMember()
      const { POST } = await import("../../app/api/business/shares/route")
      const res = await POST(mockRequest({
        transactionType: "internal_transfer",
        sellerMemberId: member.id,
        sharesCount: "10",
      }))
      expect(res.status).toBe(400)
    })
  })

  describe("GET /api/business/shares", () => {
    it("lists all transactions with member names", async () => {
      const member = await createBusinessMember()
      await createShareTransaction({ buyerMemberId: member.id })
      const { GET } = await import("../../app/api/business/shares/route")
      const res = await GET()
      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.transactions).toHaveLength(1)
      expect(data.transactions[0].buyerName).toBe(member.name)
    })
  })
})
