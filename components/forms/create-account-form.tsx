"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Save } from "lucide-react"
import { toast } from "sonner"
import { useCreateAccount } from "@/hooks/mutations/use-create-account"

interface CreateAccountFormProps {
  onSuccess: () => void
  onCancel: () => void
}

export function CreateAccountForm({ onSuccess, onCancel }: CreateAccountFormProps) {
  const createAccount = useCreateAccount()
  const [saving, setSaving] = useState(false)
  const [name, setName] = useState("")
  const [type, setType] = useState("")
  const [balance, setBalance] = useState("")
  const [description, setDescription] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    createAccount.mutate(
      {
        name,
        type: type as "bank" | "cash",
        balance: balance ? Number(balance) : undefined,
        description: description || undefined,
      },
      {
        onSuccess: () => {
          toast.success("Account created successfully")
          onSuccess()
        },
        onError: () => {
          toast.error("Failed to create account")
          setSaving(false)
        },
        onSettled: () => {
          setSaving(false)
        },
      }
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Account Name *</Label>
        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="type">Account Type *</Label>
        <Select value={type} onValueChange={setType} required>
          <SelectTrigger id="type">
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="bank">Bank Account</SelectItem>
            <SelectItem value="cash">Cash</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="balance">Opening Balance (Rs.)</Label>
        <Input id="balance" type="number" min="0" step="0.01" value={balance} onChange={(e) => setBalance(e.target.value)} />
        <p className="text-xs text-muted-foreground">Leave as 0 if this is a new account with no initial balance.</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <textarea
          id="description"
          className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      <div className="flex items-center justify-end gap-3 pt-4 border-t">
        <Button type="button" variant="outline" disabled={saving} onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={saving}>
          {saving ? (
            <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Creating...</>
          ) : (
            <><Save className="h-4 w-4 mr-2" />Create Account</>
          )}
        </Button>
      </div>
    </form>
  )
}