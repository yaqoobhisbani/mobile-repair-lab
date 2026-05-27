import { NextResponse } from "next/server"
import { db } from "@/db"
import { users } from "@/db/schema"
import { eq } from "drizzle-orm"
import { hashPassword, signToken, setAuthCookie } from "@/lib/auth-server"

export async function POST(request: Request) {
  try {
    const { email, password, name } = await request.json()

    if (!email || !password || !name) {
      return NextResponse.json({ error: "Email, password, and name are required" }, { status: 400 })
    }

    const [existing] = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1)

    if (existing) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 })
    }

    const passwordHash = await hashPassword(password)

    const [user] = await db
      .insert(users)
      .values({ email: email.toLowerCase(), passwordHash, name })
      .returning({ id: users.id, email: users.email, name: users.name })

    const token = signToken({ userId: user.id, email: user.email })
    await setAuthCookie(token)

    return NextResponse.json({ user }, { status: 201 })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
