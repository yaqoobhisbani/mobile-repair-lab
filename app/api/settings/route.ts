import { NextResponse } from "next/server"
import { getSettings, upsertSettings } from "@/db/settings"

export async function GET() {
  try {
    const data = await getSettings()
    return NextResponse.json({ settings: data })
  } catch {
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { shopName, shopAddress, shopPhone, currency } = body

    const data: Record<string, string> = {}
    if (shopName?.trim()) data.shopName = shopName.trim()
    if (shopAddress?.trim()) data.shopAddress = shopAddress.trim()
    if (shopPhone?.trim()) data.shopPhone = shopPhone.trim()
    if (currency?.trim()) data.currency = currency.trim()

    const settings = await upsertSettings(data)
    return NextResponse.json({ settings })
  } catch {
    return NextResponse.json({ error: "Failed to save settings" }, { status: 500 })
  }
}
