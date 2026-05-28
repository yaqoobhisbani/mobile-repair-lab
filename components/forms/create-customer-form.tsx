"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Save } from "lucide-react"
import { toast } from "sonner"

interface CreateCustomerFormProps {
  onSuccess: () => void
  onCancel: () => void
}

export function CreateCustomerForm({ onSuccess, onCancel }: CreateCustomerFormProps) {
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
        setSaving(false)
        return
      }

      toast.success("Customer created successfully")
      onSuccess()
    } catch {
      toast.error("Failed to create customer")
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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

      <div className="flex items-center justify-end gap-3 pt-4 border-t">
        <Button type="button" variant="outline" disabled={saving} onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={saving}>
          {saving ? (
            <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving...</>
          ) : (
            <><Save className="h-4 w-4 mr-2" />Add Customer</>
          )}
        </Button>
      </div>
    </form>
  )
}
