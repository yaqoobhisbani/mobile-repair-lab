"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Save, Loader2, User } from "lucide-react"
import { useSettings } from "@/hooks/queries/use-settings"
import { useSaveSettings } from "@/hooks/mutations/use-save-settings"
import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { toast } from "sonner"

function useCurrentUser() {
  return useQuery({
    queryKey: ["auth", "me"],
    queryFn: () => api<{ user: { id: number; email: string; name: string } | null }>("/api/auth/me"),
  })
}

export default function SettingsPage() {
  const { data: settings, isLoading: settingsLoading } = useSettings()
  const { data: userData, isLoading: userLoading } = useCurrentUser()
  const saveMutation = useSaveSettings()

  const [currency, setCurrency] = useState("PKR")
  const [shopName, setShopName] = useState("Mobile Repair Lab")
  const [shopAddress, setShopAddress] = useState("123 Repair Street, City, State 12345")
  const [shopPhone, setShopPhone] = useState("(555) 987-6543")

  const [userName, setUserName] = useState("")
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [savingAccount, setSavingAccount] = useState(false)

  useEffect(() => {
    if (settings) {
      setShopName(settings.shopName)
      setShopAddress(settings.shopAddress)
      setShopPhone(settings.shopPhone)
      setCurrency(settings.currency)
    }
  }, [settings])

  useEffect(() => {
    if (userData?.user) {
      setUserName(userData.user.name)
    }
  }, [userData])

  const handleSaveShop = (e: React.FormEvent) => {
    e.preventDefault()
    saveMutation.mutate(
      { shopName, shopAddress, shopPhone, currency },
      { onSuccess: () => toast.success("Settings saved"), onError: () => toast.error("Failed to save settings") }
    )
  }

  const handleSaveAccount = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingAccount(true)

    if (newPassword && newPassword !== confirmPassword) {
      toast.error("New passwords do not match")
      setSavingAccount(false)
      return
    }

    try {
      const body: Record<string, string> = { name: userName }
      if (newPassword) {
        body.currentPassword = currentPassword
        body.newPassword = newPassword
      }

      const res = await fetch("/api/auth/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to update account")

      toast.success("Account updated")
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSavingAccount(false)
    }
  }

  const isLoading = settingsLoading || userLoading

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
        <p className="text-sm text-muted-foreground">Manage your shop configuration and account.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Shop Information</CardTitle>
                <CardDescription>Business details for invoices and receipts.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveShop} className="space-y-4">
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
              <div className="space-y-2">
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
              <div className="flex justify-end pt-2">
                <Button type="submit" disabled={saveMutation.isPending} size="sm">
                  {saveMutation.isPending ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving...</>
                  ) : (
                    <><Save className="h-4 w-4 mr-2" />Save</>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-muted-foreground" />
              <div>
                <CardTitle>Account</CardTitle>
                <CardDescription>Update your name or password.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveAccount} className="space-y-4">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Email</Label>
                <p className="text-sm font-medium">{userData?.user?.email}</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="userName">Name</Label>
                <Input id="userName" value={userName} onChange={(e) => setUserName(e.target.value)} />
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <Input id="currentPassword" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="Required to change password" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input id="newPassword" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Min 6 characters" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Re-enter new password" />
              </div>

              <div className="flex justify-end pt-2">
                <Button type="submit" disabled={savingAccount} size="sm">
                  {savingAccount ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving...</>
                  ) : (
                    <><Save className="h-4 w-4 mr-2" />Update</>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
