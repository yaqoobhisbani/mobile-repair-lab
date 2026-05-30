import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { jwtVerify } from "jose"

const COOKIE_NAME = "mrl_session"
const publicApiPaths = ["/api/auth/login"]

const ENCODED_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? (() => { throw new Error("JWT_SECRET environment variable is not set") })(),
)

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (!pathname.startsWith("/api/")) return NextResponse.next()
  if (publicApiPaths.some((p) => pathname === p)) return NextResponse.next()
  if (pathname === "/api/auth/logout") return NextResponse.next()
  if (pathname.startsWith("/api/track/")) return NextResponse.next()

  const token = request.cookies.get(COOKIE_NAME)?.value
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    await jwtVerify(token, ENCODED_SECRET)
    return NextResponse.next()
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
}

export const config = {
  matcher: "/api/:path*",
}
