import { db } from "./index"
import { settings } from "./schema"
import { eq } from "drizzle-orm"

export type ShopSettings = {
  id: number
  shopName: string
  shopAddress: string
  shopPhone: string
  currency: string
}

const defaults = {
  shopName: "Mobile Repair Lab",
  shopAddress: "123 Repair Street, City, State 12345",
  shopPhone: "(555) 987-6543",
  currency: "PKR",
}

export async function getSettings(): Promise<ShopSettings> {
  const rows = await db.select().from(settings).limit(1)
  if (rows.length === 0) {
    const [row] = await db.insert(settings).values(defaults).returning()
    return row
  }
  return rows[0]
}

export async function upsertSettings(data: Partial<typeof defaults>) {
  const existing = await db.select({ id: settings.id }).from(settings).limit(1)
  if (existing.length > 0) {
    const [row] = await db.update(settings).set(data).where(eq(settings.id, existing[0].id)).returning()
    return row
  }
  const [row] = await db.insert(settings).values({ ...defaults, ...data }).returning()
  return row
}
