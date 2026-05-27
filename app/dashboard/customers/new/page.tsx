"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Save, Loader2 } from "lucide-react"
import { toast } from "sonner"

export default function NewCustomerPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, email: email || undefined }),
      })

      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || "Failed to create customer")
        return
      }

      router.push("/dashboard/customers")
      toast.success("Customer created successfully")
    } catch {
      toast.error("Failed to create customer")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/customers">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Add Customer</h1>
          <p className="text-muted-foreground">Add a new customer to your directory.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Customer Details</CardTitle>
            <CardDescription>Name and phone number are required.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number *</Label>
                <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} required />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
          </CardContent>
        </Card>

        <Separator className="my-6" />

        <div className="flex items-center justify-end gap-4">
          <Link href="/dashboard/customers">
            <Button type="button" variant="outline" disabled={saving}>Cancel</Button>
          </Link>
          <Button type="submit" disabled={saving}>
            {saving ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving...</>
            ) : (
              <><Save className="h-4 w-4 mr-2" />Add Customer</>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
