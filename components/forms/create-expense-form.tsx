"use client"

import { useState } from "react"
import { PrivacyAmount } from "@/components/privacy-amount"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Save } from "lucide-react"
import { toast } from "sonner"
import { DatePicker } from "@/components/date-picker"
import { useAccounts } from "@/hooks/queries/use-accounts"
import { useCreateExpense } from "@/hooks/mutations/use-create-expense"

interface CreateExpenseFormProps {
  onSuccess: () => void
  onCancel: () => void
}

export function CreateExpenseForm({ onSuccess, onCancel }: CreateExpenseFormProps) {
  const { data: accounts = [] } = useAccounts()
  const createExpense = useCreateExpense()

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [description, setDescription] = useState("")
  const [amount, setAmount] = useState("")
  const [category, setCategory] = useState("")
  const [customCategory, setCustomCategory] = useState("")
  const [accountId, setAccountId] = useState("")
  const [date, setDate] = useState<Date>(new Date())

  const selectedAccount = accounts.find((a) => String(a.id) === accountId)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError("")

    createExpense.mutate(
      {
        description,
        amount: Number(amount),
        category: category === "other" ? (customCategory || undefined) : (category || undefined),
        accountId: Number(accountId),
        accountName: selectedAccount?.name,
        date: date.toISOString(),
      } as any,
      {
        onSuccess: () => {
          toast.success("Expense created successfully")
          onSuccess()
        },
        onError: () => {
          setError("Failed to create expense")
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
      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
      )}

      <div className="space-y-2">
        <Label htmlFor="description">Description *</Label>
        <Input
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="e.g. Electricity bill, Tea, Consumables"
          required
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="amount">Amount (Rs.) *</Label>
          <Input
            id="amount"
            type="number"
            min="0.01"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <Select value={category} onValueChange={(v) => { setCategory(v); if (v !== "other") setCustomCategory("") }}>
            <SelectTrigger id="category">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Rent">Rent</SelectItem>
              <SelectItem value="Utilities">Utilities</SelectItem>
              <SelectItem value="Supplies">Supplies</SelectItem>
              <SelectItem value="Maintenance">Maintenance</SelectItem>
              <SelectItem value="Transport">Transport</SelectItem>
              <SelectItem value="Tea & Food">Tea & Food</SelectItem>
              <SelectItem value="Marketing">Marketing</SelectItem>
              <SelectItem value="Salary">Salary</SelectItem>
              <SelectItem value="Equipment">Equipment</SelectItem>
              <SelectItem value="Software">Software</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
          {category === "other" && (
            <Input
              className="mt-2"
              placeholder="Enter custom category"
              value={customCategory}
              onChange={(e) => setCustomCategory(e.target.value)}
            />
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="account">Account *</Label>
        <Select value={accountId} onValueChange={setAccountId} required>
          <SelectTrigger id="account">
            <SelectValue placeholder="Select account" />
          </SelectTrigger>
          <SelectContent>
            {accounts.map((a) => (
              <SelectItem key={a.id} value={String(a.id)}>
                {a.name} (<PrivacyAmount>Rs. {parseFloat(a.balance).toFixed(0)}</PrivacyAmount>)
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selectedAccount && (
          <p className="text-xs text-muted-foreground">
            Balance after expense: <PrivacyAmount>Rs.{" "}
            {Math.max(0, parseFloat(selectedAccount.balance) - parseFloat(amount || "0")).toFixed(2)}</PrivacyAmount>
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="date">Date</Label>
        <DatePicker
          value={date}
          onChange={(d) => d && setDate(d)}
        />
      </div>

      <div className="flex items-center justify-end gap-3 pt-4 border-t">
        <Button type="button" variant="outline" disabled={saving} onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={saving}>
          {saving ? (
            <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Creating...</>
          ) : (
            <><Save className="h-4 w-4 mr-2" />Create Expense</>
          )}
        </Button>
      </div>
    </form>
  )
}