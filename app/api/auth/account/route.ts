import { NextResponse } from "next/server"
import { db } from "@/db"
import { users } from "@/db/schema"
import { eq } from "drizzle-orm"
import { getCurrentUser, hashPassword, comparePassword } from "@/lib/auth-server"

export async function PATCH(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { name, currentPassword, newPassword } = body

    const updateData: Record<string, string> = {}

    if (name !== undefined) {
      if (typeof name !== "string" || name.trim().length === 0) {
        return NextResponse.json({ error: "Name is required" }, { status: 400 })
      }
      updateData.name = name.trim()
    }

    if (newPassword) {
      if (typeof newPassword !== "string" || newPassword.length < 6) {
        return NextResponse.json({ error: "New password must be at least 6 characters" }, { status: 400 })
      }
      if (!currentPassword) {
        return NextResponse.json({ error: "Current password is required to set a new password" }, { status: 400 })
      }

      const [stored] = await db
        .select({ passwordHash: users.passwordHash })
        .from(users)
        .where(eq(users.id, user.id))
        .limit(1)

      if (!stored) {
        return NextResponse.json({ error: "User not found" }, { status: 404 })
      }

      const valid = await comparePassword(currentPassword, stored.passwordHash)
      if (!valid) {
        return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 })
      }

      updateData.passwordHash = await hashPassword(newPassword)
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "No changes provided" }, { status: 400 })
    }

    await db.update(users).set(updateData).where(eq(users.id, user.id))

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Failed to update account" }, { status: 500 })
  }
}
