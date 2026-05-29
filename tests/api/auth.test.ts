import { describe, it, expect, beforeEach } from "vitest"
import { truncateAll } from "../helpers/db"
import { createUser } from "../helpers/fixtures"
import { mockRequest } from "../helpers/api"

vi.mock("next/headers", () => ({
  cookies: vi.fn(() =>
    Promise.resolve({
      get: vi.fn(() => undefined),
      getAll: vi.fn(() => []),
      has: vi.fn(() => false),
      set: vi.fn(),
      delete: vi.fn(),
      toString: vi.fn(() => ""),
    })
  ),
}))

describe("POST /api/auth/register", () => {
  beforeEach(async () => {
    await truncateAll()
  })

  it("registers a new user", async () => {
    const { POST } = await import("../../app/api/auth/register/route")
    const res = await POST(
      mockRequest({ email: "new@example.com", password: "secret123", name: "New User" })
    )
    expect(res.status).toBe(201)
    const data = await res.json()
    expect(data.user.email).toBe("new@example.com")
    expect(data.user.name).toBe("New User")
  })

  it("rejects missing fields", async () => {
    const { POST } = await import("../../app/api/auth/register/route")
    const res = await POST(mockRequest({ email: "nope@example.com" }))
    expect(res.status).toBe(400)
  })

  it("rejects duplicate email", async () => {
    await createUser({ email: "dup@example.com" })
    const { POST } = await import("../../app/api/auth/register/route")
    const res = await POST(
      mockRequest({ email: "dup@example.com", password: "x", name: "Dup" })
    )
    expect(res.status).toBe(409)
  })
})

describe("POST /api/auth/login", () => {
  beforeEach(async () => {
    await truncateAll()
  })

  it("logs in with valid credentials", async () => {
    await createUser({ email: "login@example.com" })
    const { POST } = await import("../../app/api/auth/login/route")
    const res = await POST(
      mockRequest({ email: "login@example.com", password: "password123" })
    )
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.user.email).toBe("login@example.com")
  })

  it("rejects wrong password", async () => {
    await createUser({ email: "wrongpw@example.com" })
    const { POST } = await import("../../app/api/auth/login/route")
    const res = await POST(
      mockRequest({ email: "wrongpw@example.com", password: "wrongpassword" })
    )
    expect(res.status).toBe(401)
  })

  it("rejects non-existent user", async () => {
    const { POST } = await import("../../app/api/auth/login/route")
    const res = await POST(
      mockRequest({ email: "nobody@example.com", password: "password123" })
    )
    expect(res.status).toBe(401)
  })
})

describe("GET /api/auth/me", () => {
  beforeEach(async () => {
    await truncateAll()
  })

  it("returns 401 when not authenticated", async () => {
    const { GET } = await import("../../app/api/auth/me/route")
    const res = await GET()
    expect(res.status).toBe(401)
    const data = await res.json()
    expect(data.user).toBeNull()
  })
})

describe("POST /api/auth/logout", () => {
  it("returns success", async () => {
    const { POST } = await import("../../app/api/auth/logout/route")
    const res = await POST()
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.success).toBe(true)
  })
})
