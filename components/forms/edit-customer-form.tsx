"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Save, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { useConfirm } from "@/hooks/use-confirm"

interface EditCustomerFormProps {
  customerId: number
  onSuccess: () => void
  onCancel: () => void
}

export function EditCustomerForm({ customerId, onSuccess, onCancel }: EditCustomerFormProps) {
  const { confirm, dialog } = useConfirm()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")

  useEffect(() => {
    fetch(`/api/customers/${customerId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Not found")
        return res.json()
      })
      .then((data) => {
        setName(data.customer.name)
        setPhone(data.customer.phone)
        setEmail(data.customer.email ?? "")
      })
      .catch(() => toast.error("Customer not found"))
      .finally(() => setLoading(false))
  }, [customerId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const res = await fetch(`/api/customers/${customerId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, email: email || null }),
      })

      if (!res.ok) {
        const data = await res.json()
        toast.error(data.error || "Failed to update customer")
        setSaving(false)
        return
      }

      toast.success("Customer updated successfully")
      onSuccess()
    } catch {
      toast.error("Failed to update customer")
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    const ok = await confirm({ title: "Delete customer", description: `Delete customer "${name}"? This cannot be undone.`, variant: "destructive" })
    if (!ok) return
    try {
      const res = await fetch(`/api/customers/${customerId}`, { method: "DELETE" })
      if (res.ok) {
        toast.success("Customer deleted successfully")
        onSuccess()
      }
    } catch {}
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
        Loading customer...
      </div>
    )
  }

  return (
    <>
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

        <div className="flex items-center justify-between pt-4 border-t">
          <Button type="button" variant="destructive" size="sm" onClick={handleDelete}>
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
          <div className="flex items-center gap-3">
            <Button type="button" variant="outline" disabled={saving} onClick={onCancel}>Cancel</Button>
            <Button type="submit" disabled={saving}>
              {saving ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving...</>
              ) : (
                <><Save className="h-4 w-4 mr-2" />Save Changes</>
              )}
            </Button>
          </div>
        </div>
      </form>
      {dialog}
    </>
  )
}
