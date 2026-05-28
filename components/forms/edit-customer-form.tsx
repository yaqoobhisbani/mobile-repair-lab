"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Save, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { useConfirm } from "@/hooks/use-confirm"
import { useCustomer } from "@/hooks/queries/use-customer"
import { useUpdateCustomer } from "@/hooks/mutations/use-update-customer"
import { useDeleteCustomer } from "@/hooks/mutations/use-delete-customer"

interface EditCustomerFormProps {
  customerId: number
  onSuccess: () => void
  onCancel: () => void
}

export function EditCustomerForm({ customerId, onSuccess, onCancel }: EditCustomerFormProps) {
  const { confirm, dialog } = useConfirm()
  const { data: customer, isLoading } = useCustomer(customerId)
  const updateCustomer = useUpdateCustomer()
  const deleteCustomer = useDeleteCustomer()

  const [saving, setSaving] = useState(false)
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")

  useEffect(() => {
    if (customer) {
      setName(customer.name)
      setPhone(customer.phone)
      setEmail(customer.email ?? "")
    }
  }, [customer])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    updateCustomer.mutate(
      { id: customerId, name, phone, email: email || null },
      {
        onSuccess: () => {
          toast.success("Customer updated successfully")
          onSuccess()
        },
        onError: () => {
          toast.error("Failed to update customer")
          setSaving(false)
        },
        onSettled: () => {
          setSaving(false)
        },
      }
    )
  }

  const handleDelete = async () => {
    const ok = await confirm({ title: "Delete customer", description: `Delete customer "${name}"? This cannot be undone.`, variant: "destructive" })
    if (!ok) return
    deleteCustomer.mutate(customerId, {
      onSuccess: () => {
        toast.success("Customer deleted successfully")
        onSuccess()
      },
    })
  }

  if (isLoading) {
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