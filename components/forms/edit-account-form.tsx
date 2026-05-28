"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Save, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { useConfirm } from "@/hooks/use-confirm"
import { useAccount } from "@/hooks/queries/use-account"
import { useUpdateAccount } from "@/hooks/mutations/use-update-account"
import { useDeleteAccount } from "@/hooks/mutations/use-delete-account"

interface EditAccountFormProps {
  accountId: number
  onSuccess: () => void
  onCancel: () => void
}

export function EditAccountForm({ accountId, onSuccess, onCancel }: EditAccountFormProps) {
  const { confirm, dialog } = useConfirm()
  const { data: account, isLoading } = useAccount(accountId)
  const updateAccount = useUpdateAccount()
  const deleteAccount = useDeleteAccount()

  const [saving, setSaving] = useState(false)
  const [name, setName] = useState("")
  const [type, setType] = useState("")
  const [description, setDescription] = useState("")

  useEffect(() => {
    if (account) {
      setName(account.name)
      setType(account.type)
      setDescription(account.description ?? "")
    }
  }, [account])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    updateAccount.mutate(
      { id: accountId, name, type: type as "bank" | "cash", description: description || null },
      {
        onSuccess: () => {
          toast.success("Account updated successfully")
          onSuccess()
        },
        onError: () => {
          toast.error("Failed to update account")
          setSaving(false)
        },
        onSettled: () => {
          setSaving(false)
        },
      }
    )
  }

  const handleDelete = async () => {
    const ok = await confirm({ title: "Delete account", description: "Delete this account? This cannot be undone.", variant: "destructive" })
    if (!ok) return
    deleteAccount.mutate(accountId, {
      onSuccess: () => {
        toast.success("Account deleted successfully")
        onSuccess()
      },
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
        Loading account...
      </div>
    )
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Account Name *</Label>
          <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>

        <div className="space-y-2">
          <Label htmlFor="type">Account Type *</Label>
          <Select value={type} onValueChange={setType} required>
            <SelectTrigger id="type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="bank">Bank Account</SelectItem>
              <SelectItem value="cash">Cash</SelectItem>
            </SelectContent>
          </Select>
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