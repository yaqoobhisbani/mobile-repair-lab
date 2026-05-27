import { NextResponse } from "next/server"
import { db } from "@/db"
import { customers } from "@/db/schema"
import { desc, ilike, or } from "drizzle-orm"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search")
    const limit = searchParams.get("limit")

    let items
    if (search) {
      const q = db
        .select()
        .from(customers)
        .where(
          or(
            ilike(customers.name, `%${search}%`),
            ilike(customers.phone, `%${search}%`),
          ),
        )
        .orderBy(desc(customers.id))
      items = await (limit ? q.limit(Number(limit)) : q)
    } else {
      const q = db.select().from(customers).orderBy(desc(customers.id))
      items = await (limit ? q.limit(Number(limit)) : q)
    }

    return NextResponse.json({ customers: items })
  } catch {
    return NextResponse.json({ error: "Failed to fetch customers" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, phone, email } = body

    if (!name?.trim() || !phone?.trim()) {
      return NextResponse.json({ error: "Name and phone number are required" }, { status: 400 })
    }

    const [customer] = await db
      .insert(customers)
      .values({
        name: name.trim(),
        phone: phone.trim(),
        email: email?.trim() || null,
      })
      .returning()

    return NextResponse.json({ customer }, { status: 201 })
  } catch {
    return NextResponse.json({ error: "Failed to create customer" }, { status: 500 })
  }
}
