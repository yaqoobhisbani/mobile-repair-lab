"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Settings, Save, Loader2 } from "lucide-react"
import { PageTransition } from "@/components/page-transition"
import { toast } from "sonner"
import { Skeleton } from "@/components/ui/skeleton"
import { useSettings } from "@/hooks/queries/use-settings"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { queryKeys } from "@/lib/query-keys"

export default function BusinessSettingsPage() {
  const { data: settings, isLoading } = useSettings()
  const queryClient = useQueryClient()
  const [navPrice, setNavPrice] = useState("1000")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (settings?.navPrice) setNavPrice(settings.navPrice)
  }, [settings])

  const mutation = useMutation({
    mutationFn: (data: { navPrice: string }) =>
      api("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.settings.all })
    },
  })

  async function handleSave() {
    const price = parseFloat(navPrice)
    if (isNaN(price) || price <= 0) { toast.error("Enter a valid NAV price"); return }
    setSaving(true)
    try {
      await mutation.mutateAsync({ navPrice: String(price) })
      toast.success("Settings saved")
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <PageTransition>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-600 to-gray-600 bg-clip-text text-transparent">Business Settings</h1>
            <p className="text-sm text-muted-foreground">Configure business portal parameters.</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">NAV Price (Par Value)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <Skeleton className="h-10 w-full" />
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="nav-price">Price per Share (Rs.)</Label>
                  <Input
                    id="nav-price"
                    type="number"
                    min="1"
                    step="100"
                    value={navPrice}
                    onChange={(e) => setNavPrice(e.target.value)}
                    placeholder="1000"
                  />
                  <p className="text-xs text-muted-foreground">
                    This value is used as the par value for issuing shares and calculating equity (currently Rs. {settings?.navPrice ?? "1000"}/share).
                  </p>
                </div>
                <div className="flex justify-end pt-2">
                  <Button onClick={handleSave} disabled={saving}>
                    {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    <Save className="h-4 w-4 mr-2" />
                    Save
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </PageTransition>
  )
}
