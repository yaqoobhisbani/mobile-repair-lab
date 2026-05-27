"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Save, Loader2 } from "lucide-react"
import { toast } from "sonner"

interface Account {
  id: number
  name: string
  type: string
  balance: string
}

export default function NewExpensePage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [description, setDescription] = useState("")
  const [amount, setAmount] = useState("")
  const [category, setCategory] = useState("")
  const [accountId, setAccountId] = useState("")
  const [date, setDate] = useState(new Date().toISOString().split("T")[0])
  const [accounts, setAccounts] = useState<Account[]>([])

  useEffect(() => {
    fetch("/api/accounts")
      .then((res) => {
        if (!res.ok) throw new Error()
        return res.json()
      })
      .then((data) => setAccounts(data.accounts ?? []))
      .catch(() => toast.error("Failed to load accounts"))
  }, [])

  const selectedAccount = accounts.find((a) => String(a.id) === accountId)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError("")

    try {
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description,
          amount,
          category: category || undefined,
          accountId,
          accountName: selectedAccount?.name,
          date: date ? new Date(date).toISOString() : undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Failed to create expense")
        setSaving(false)
        return
      }
      toast.success("Expense created successfully")
      router.push("/dashboard/finance/expenses")
    } catch {
      toast.error("Failed to create expense")
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/finance/expenses">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">New Expense</h1>
          <p className="text-muted-foreground">Log a business expense.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="max-w-lg">
          <CardHeader>
            <CardTitle>Expense Details</CardTitle>
            <CardDescription>Enter the expense information below. The amount will be deducted from the selected account.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
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
                <Input
                  id="category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="e.g. Utilities, Supplies"
                />
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
                      {a.name} (Rs. {parseFloat(a.balance).toFixed(0)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedAccount && (
                <p className="text-xs text-muted-foreground">
                  Balance after expense: Rs.{" "}
                  {Math.max(0, parseFloat(selectedAccount.balance) - parseFloat(amount || "0")).toFixed(2)}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <Separator className="my-6" />

        <div className="flex items-center justify-end gap-4">
          <Link href="/dashboard/finance/expenses">
            <Button type="button" variant="outline" disabled={saving}>Cancel</Button>
          </Link>
          <Button type="submit" disabled={saving}>
            {saving ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Creating...</>
            ) : (
              <><Save className="h-4 w-4 mr-2" />Create Expense</>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
