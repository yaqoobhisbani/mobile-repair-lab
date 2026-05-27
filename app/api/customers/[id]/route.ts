import { NextResponse } from "next/server"
import { db } from "@/db"
import { customers } from "@/db/schema"
import { eq } from "drizzle-orm"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const numericId = Number(id)
    if (isNaN(numericId)) {
      return NextResponse.json({ error: "Invalid customer ID" }, { status: 400 })
    }

    const [customer] = await db
      .select()
      .from(customers)
      .where(eq(customers.id, numericId))
      .limit(1)

    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 })
    }

    return NextResponse.json({ customer })
  } catch {
    return NextResponse.json({ error: "Failed to fetch customer" }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const numericId = Number(id)
    if (isNaN(numericId)) {
      return NextResponse.json({ error: "Invalid customer ID" }, { status: 400 })
    }

    const body = await request.json()
    const { name, phone, email } = body

    if (name !== undefined && !name.trim()) {
      return NextResponse.json({ error: "Name cannot be empty" }, { status: 400 })
    }
    if (phone !== undefined && !phone.trim()) {
      return NextResponse.json({ error: "Phone number cannot be empty" }, { status: 400 })
    }

    const [customer] = await db
      .update(customers)
      .set({
        name: name !== undefined ? name.trim() : undefined,
        phone: phone !== undefined ? phone.trim() : undefined,
        email: email !== undefined ? (email?.trim() || null) : undefined,
      })
      .where(eq(customers.id, numericId))
      .returning()

    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 })
    }

    return NextResponse.json({ customer })
  } catch {
    return NextResponse.json({ error: "Failed to update customer" }, { status: 500 })
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const numericId = Number(id)
    if (isNaN(numericId)) {
      return NextResponse.json({ error: "Invalid customer ID" }, { status: 400 })
    }

    const [customer] = await db
      .delete(customers)
      .where(eq(customers.id, numericId))
      .returning()

    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Failed to delete customer" }, { status: 500 })
  }
}
