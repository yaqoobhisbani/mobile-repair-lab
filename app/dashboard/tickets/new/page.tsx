"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Save } from "lucide-react"
import Link from "next/link"

export default function NewTicketPage() {
  const router = useRouter()
  const [customerName, setCustomerName] = useState("")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [brand, setBrand] = useState("")
  const [model, setModel] = useState("")
  const [imei, setImei] = useState("")
  const [passcode, setPasscode] = useState("")
  const [category, setCategory] = useState("")
  const [description, setDescription] = useState("")
  const [estimatedCost, setEstimatedCost] = useState("")
  const [targetDate, setTargetDate] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    router.push("/dashboard/tickets")
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/tickets">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">New Ticket</h1>
          <p className="text-muted-foreground">Create a new repair ticket.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Customer Information</CardTitle>
              <CardDescription>Enter the customer&apos;s contact details.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="customerName">Full Name *</Label>
                <Input id="customerName" value={customerName} onChange={(e) => setCustomerName(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number *</Label>
                <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Device Information</CardTitle>
              <CardDescription>Details about the device being repaired.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="brand">Brand *</Label>
                <Select value={brand} onValueChange={setBrand}>
                  <SelectTrigger id="brand">
                    <SelectValue placeholder="Select brand" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="apple">Apple</SelectItem>
                    <SelectItem value="samsung">Samsung</SelectItem>
                    <SelectItem value="google">Google</SelectItem>
                    <SelectItem value="oneplus">OnePlus</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="model">Model *</Label>
                <Input id="model" placeholder="e.g. iPhone 15 Pro" value={model} onChange={(e) => setModel(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="imei">Serial / IMEI Number</Label>
                <Input id="imei" value={imei} onChange={(e) => setImei(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="passcode">Passcode / Pattern</Label>
                <Input id="passcode" value={passcode} onChange={(e) => setPasscode(e.target.value)} />
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Issue Details</CardTitle>
              <CardDescription>Describe the problem and set expectations.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="category">Problem Category *</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger id="category">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="screen">Screen</SelectItem>
                      <SelectItem value="battery">Battery</SelectItem>
                      <SelectItem value="liquid">Liquid Damage</SelectItem>
                      <SelectItem value="software">Software</SelectItem>
                      <SelectItem value="charging">Charging Port</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="targetDate">Target Completion Date</Label>
                  <Input id="targetDate" type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Problem Description *</Label>
                <textarea
                  id="description"
                  className="flex min-h-[100px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2 sm:w-64">
                <Label htmlFor="estimatedCost">Estimated Cost (Rs.)</Label>
                <Input id="estimatedCost" type="number" min="0" step="0.01" value={estimatedCost} onChange={(e) => setEstimatedCost(e.target.value)} />
              </div>
            </CardContent>
          </Card>
        </div>

        <Separator className="my-6" />

        <div className="flex items-center justify-end gap-4">
          <Link href="/dashboard/tickets">
            <Button type="button" variant="outline">Cancel</Button>
          </Link>
          <Button type="submit">
            <Save className="h-4 w-4 mr-2" />
            Create Ticket
          </Button>
        </div>
      </form>
    </div>
  )
}
