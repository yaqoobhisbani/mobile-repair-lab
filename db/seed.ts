import { db } from "./index"
import { users } from "./schema"
import { hashPassword } from "@/lib/auth-server"

async function seed() {
  const email = "admin@example.com"
  const password = "password123"
  const name = "Admin"

  const passwordHash = await hashPassword(password)

  await db.insert(users).values({ email, passwordHash, name }).onConflictDoNothing()

  console.log(`Seeded admin user: ${email} / ${password}`)
  process.exit(0)
}

seed().catch((err) => {
  console.error("Seed failed:", err)
  process.exit(1)
})
