"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Landmark, ArrowUpRight, ArrowDownRight, ExternalLink } from "lucide-react"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import { PageTransition } from "@/components/page-transition"

interface Transaction {
  id: number
  accountId: number
  type: "credit" | "debit"
  amount: string
  description: string
  referenceType: "ticket" | "expense" | "opening_balance"
  referenceId: string | null
  createdAt: string
}

interface Account {
  id: number
  name: string
  type: "bank" | "cash"
  balance: string
  description: string | null
  createdAt: string
}

const typeLabels: Record<string, string> = {
  bank: "Bank Account",
  cash: "Cash",
}

const referenceLinks: Record<string, string> = {
  ticket: "/dashboard/tickets/",
  expense: "",
  opening_balance: "",
}

export default function ViewAccountPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [account, setAccount] = useState<Account | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch("/api/accounts").then((r) => r.json()),
      fetch(`/api/accounts/${id}/transactions`).then((r) => r.json()),
    ])
      .then(([accountsData, txData]) => {
        const acc = accountsData.accounts?.find((a: Account) => String(a.id) === id)
        setAccount(acc || txData.account)
        setTransactions(txData.transactions ?? [])
      })
      .catch(() => toast.error("Failed to load account"))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!account) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4">
        <Landmark className="h-12 w-12 text-muted-foreground" />
        <p className="text-lg font-medium">Account not found</p>
        <Button variant="outline" onClick={() => router.push("/dashboard/finance/accounts")}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Accounts
        </Button>
      </div>
    )
  }

  const totalCredits = transactions
    .filter((t) => t.type === "credit")
    .reduce((s, t) => s + parseFloat(t.amount), 0)

  const totalDebits = transactions
    .filter((t) => t.type === "debit")
    .reduce((s, t) => s + parseFloat(t.amount), 0)

  return (
    <PageTransition>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/finance/accounts">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-emerald-500 to-cyan-500 bg-clip-text text-transparent">
              {account.name}
            </h1>
            <p className="text-muted-foreground">{typeLabels[account.type]}</p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Current Balance</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">Rs. {parseFloat(account.balance).toLocaleString("en-US", { minimumFractionDigits: 2 })}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Credits</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-emerald-600">Rs. {totalCredits.toLocaleString("en-US", { minimumFractionDigits: 2 })}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Debits</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-rose-600">Rs. {totalDebits.toLocaleString("en-US", { minimumFractionDigits: 2 })}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{transactions.length}</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Transaction History</CardTitle>
          </CardHeader>
          <CardContent>
            {transactions.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No transactions yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-2 font-medium">Date</th>
                      <th className="text-left py-2 px-2 font-medium">Description</th>
                      <th className="text-left py-2 px-2 font-medium">Reference</th>
                      <th className="text-right py-2 px-2 font-medium">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((t) => (
                      <tr key={t.id} className="border-b last:border-0 hover:bg-muted/50">
                        <td className="py-3 px-2 text-muted-foreground whitespace-nowrap">
                          {new Date(t.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>
                        <td className="py-3 px-2">{t.description}</td>
                        <td className="py-3 px-2">
                          {t.referenceType === "ticket" && t.referenceId ? (
                            <Link href={`/dashboard/tickets/${t.referenceId}`} className="inline-flex items-center gap-1 text-primary hover:underline">
                              {t.referenceId}
                              <ExternalLink className="h-3 w-3" />
                            </Link>
                          ) : t.referenceType === "expense" ? (
                            <Badge variant="outline" className="text-xs">Expense</Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs">Opening</Badge>
                          )}
                        </td>
                        <td className="py-3 px-2 text-right whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 font-medium ${t.type === "credit" ? "text-emerald-600" : "text-rose-600"}`}>
                            {t.type === "credit" ? (
                              <ArrowUpRight className="h-3.5 w-3.5" />
                            ) : (
                              <ArrowDownRight className="h-3.5 w-3.5" />
                            )}
                            Rs. {parseFloat(t.amount).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PageTransition>
  )
}
