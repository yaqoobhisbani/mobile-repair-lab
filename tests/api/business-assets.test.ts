import { describe, it, expect, beforeEach } from "vitest"
import { truncateAll } from "../helpers/db"
import { createBusinessMember, createShareTransaction } from "../helpers/fixtures"
import { mockRequest, mockGetRequest, mockParams } from "../helpers/api"

describe("Business Assets API", () => {
  beforeEach(async () => {
    await truncateAll()
  })

  describe("POST /api/business/assets", () => {
    it("creates an asset with member equity funding", async () => {
      const member = await createBusinessMember()
      const { POST } = await import("../../app/api/business/assets/route")
      const res = await POST(mockRequest({
        name: "Diagnostic Computer",
        costPrice: "150000",
        purchasedByMemberId: member.id,
        fundingSource: "member_equity",
      }))
      expect(res.status).toBe(201)
      const data = await res.json()
      expect(data.asset.name).toBe("Diagnostic Computer")
      expect(data.asset.costPrice).toBe("150000.00")
      expect(data.asset.fundingSource).toBe("member_equity")
    })

    it("creates an asset with shop funds", async () => {
      const { POST } = await import("../../app/api/business/assets/route")
      const res = await POST(mockRequest({
        name: "Shelving Unit",
        costPrice: "25000",
        fundingSource: "shop_funds",
      }))
      expect(res.status).toBe(201)
      const data = await res.json()
      expect(data.asset.fundingSource).toBe("shop_funds")
    })

    it("rejects missing name", async () => {
      const { POST } = await import("../../app/api/business/assets/route")
      const res = await POST(mockRequest({ costPrice: "1000" }))
      expect(res.status).toBe(400)
    })

    it("rejects zero cost price", async () => {
      const { POST } = await import("../../app/api/business/assets/route")
      const res = await POST(mockRequest({ name: "Free Asset", costPrice: "0" }))
      expect(res.status).toBe(400)
    })

    it("requires purchaser for member equity funding", async () => {
      const { POST } = await import("../../app/api/business/assets/route")
      const res = await POST(mockRequest({
        name: "Asset",
        costPrice: "50000",
        fundingSource: "member_equity",
      }))
      expect(res.status).toBe(400)
      const data = await res.json()
      expect(data.error).toContain("member")
    })
  })

  describe("GET /api/business/assets", () => {
    it("lists all assets with depreciated values", async () => {
      const member = await createBusinessMember()
      const { db } = await import("@/db")
      const { businessAssets } = await import("../../db/schema")
      await db.insert(businessAssets).values({
        name: "Asset 1",
        costPrice: "100000",
        purchasedByMemberId: member.id,
        fundingSource: "member_equity",
      })
      await db.insert(businessAssets).values({
        name: "Asset 2",
        costPrice: "50000",
        purchasedByMemberId: null,
        fundingSource: "shop_funds",
      })
      const { GET } = await import("../../app/api/business/assets/route")
      const res = await GET()
      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.assets).toHaveLength(2)
      expect(data.assets[0].currentValue).toBeDefined()
      expect(data.assets[1].purchasedByName).toBe(member.name)
    })
  })

  describe("PUT /api/business/assets/[id]", () => {
    it("updates an asset", async () => {
      const { db } = await import("@/db")
      const { businessAssets } = await import("../../db/schema")
      const [asset] = await db.insert(businessAssets).values({
        name: "Old Asset",
        costPrice: "10000",
        fundingSource: "shop_funds",
      }).returning()
      const { PUT } = await import("../../app/api/business/assets/[id]/route")
      const res = await PUT(mockRequest({ name: "Renamed Asset", costPrice: "15000" }), mockParams(String(asset.id)))
      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.asset.name).toBe("Renamed Asset")
    })
  })

  describe("DELETE /api/business/assets/[id]", () => {
    it("deletes an asset", async () => {
      const { db } = await import("@/db")
      const { businessAssets } = await import("../../db/schema")
      const [asset] = await db.insert(businessAssets).values({
        name: "Delete Me",
        costPrice: "1000",
        fundingSource: "shop_funds",
      }).returning()
      const { DELETE } = await import("../../app/api/business/assets/[id]/route")
      const res = await DELETE(mockGetRequest(), mockParams(String(asset.id)))
      expect(res.status).toBe(200)
    })
  })
})
