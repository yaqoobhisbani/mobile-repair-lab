"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Save } from "lucide-react"

export default function SettingsPage() {
  const [currency, setCurrency] = useState("PKR")
  const [shopName, setShopName] = useState("Mobile Repair Lab")
  const [shopAddress, setShopAddress] = useState("123 Repair Street, City, State 12345")
  const [shopPhone, setShopPhone] = useState("(555) 987-6543")

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your shop configuration.</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Shop Information</CardTitle>
            <CardDescription>Your business details displayed on invoices and receipts.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="shopName">Shop Name</Label>
              <Input id="shopName" value={shopName} onChange={(e) => setShopName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="shopAddress">Address</Label>
              <Input id="shopAddress" value={shopAddress} onChange={(e) => setShopAddress(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="shopPhone">Phone</Label>
              <Input id="shopPhone" value={shopPhone} onChange={(e) => setShopPhone(e.target.value)} />
            </div>
            <div className="space-y-2 sm:w-64">
              <Label htmlFor="currency">Currency</Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger id="currency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PKR">PKR (Rs.)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Separator />

        <div className="flex justify-end">
          <Button type="submit">
            <Save className="h-4 w-4 mr-2" />
            Save Settings
          </Button>
        </div>
      </form>
    </div>
  )
}
