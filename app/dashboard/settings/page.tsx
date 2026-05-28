"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Save, Loader2 } from "lucide-react"
import { useSettings } from "@/hooks/queries/use-settings"
import { useSaveSettings } from "@/hooks/mutations/use-save-settings"
import { toast } from "sonner"

export default function SettingsPage() {
  const { data: settings, isLoading } = useSettings()
  const saveMutation = useSaveSettings()
  const [currency, setCurrency] = useState("PKR")
  const [shopName, setShopName] = useState("Mobile Repair Lab")
  const [shopAddress, setShopAddress] = useState("123 Repair Street, City, State 12345")
  const [shopPhone, setShopPhone] = useState("(555) 987-6543")

  useEffect(() => {
    if (settings) {
      setShopName(settings.shopName)
      setShopAddress(settings.shopAddress)
      setShopPhone(settings.shopPhone)
      setCurrency(settings.currency)
    }
  }, [settings])

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    saveMutation.mutate(
      { shopName, shopAddress, shopPhone, currency },
      { onSuccess: () => toast.success("Settings saved"), onError: () => toast.error("Failed to save settings") }
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24 text-muted-foreground">
        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
        Loading settings...
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-600 to-slate-600 bg-clip-text text-transparent">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your shop configuration.</p>
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
          <Button type="submit" disabled={saveMutation.isPending}>
            {saveMutation.isPending ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving...</>
            ) : (
              <><Save className="h-4 w-4 mr-2" />Save Settings</>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
