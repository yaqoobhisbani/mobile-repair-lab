import { compare, hash } from "bcryptjs"
import { SignJWT, jwtVerify } from "jose"
import { cookies } from "next/headers"
import { db } from "@/db"
import { users } from "@/db/schema"
import { eq } from "drizzle-orm"

const COOKIE_NAME = "mrl_session"

function getSecret() {
  return new TextEncoder().encode(process.env.JWT_SECRET || "dev-secret-change-in-production")
}

export interface JwtPayload {
  userId: number
  email: string
}

export async function hashPassword(password: string): Promise<string> {
  return hash(password, 12)
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return compare(password, hash)
}

export async function signToken(payload: JwtPayload): Promise<string> {
  return new SignJWT({ userId: payload.userId, email: payload.email })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(getSecret())
}

export async function setAuthCookie(token: string) {
  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60,
    path: "/",
  })
}

export async function clearAuthCookie() {
  const cookieStore = await cookies()
  cookieStore.delete(COOKIE_NAME)
}

export async function getCurrentUser() {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value
  if (!token) return null

  try {
    const { payload } = await jwtVerify(token, getSecret())
    const { userId } = payload as unknown as JwtPayload

    const [user] = await db
      .select({ id: users.id, email: users.email, name: users.name })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)

    return user || null
  } catch {
    return null
  }
}
