"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Check, Loader2, Plus, Search, X } from "lucide-react"
import { toast } from "sonner"

interface Customer {
  id: number
  name: string
  phone: string
  email: string | null
}

interface CreateTicketFormProps {
  onSuccess: () => void
  onCancel: () => void
}

export function CreateTicketForm({ onSuccess, onCancel }: CreateTicketFormProps) {
  const [customerMode, setCustomerMode] = useState<"existing" | "new">("existing")
  const [customers, setCustomers] = useState<Customer[]>([])
  const [customersLoading, setCustomersLoading] = useState(true)
  const [customerSearch, setCustomerSearch] = useState("")
  const [showDropdown, setShowDropdown] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const searchRef = useRef<HTMLDivElement>(null)

  const [newName, setNewName] = useState("")
  const [newPhone, setNewPhone] = useState("")
  const [newEmail, setNewEmail] = useState("")

  const [brand, setBrand] = useState("")
  const [model, setModel] = useState("")
  const [imei, setImei] = useState("")
  const [passcode, setPasscode] = useState("")
  const [category, setCategory] = useState("")
  const [description, setDescription] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (error) toast.error(error)
  }, [error])

  useEffect(() => {
    fetch("/api/customers")
      .then((res) => res.json())
      .then((data) => setCustomers(data.customers))
      .catch(() => {})
      .finally(() => setCustomersLoading(false))
  }, [])

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  const filteredCustomers = customers.filter(
    (c) =>
      !customerSearch ||
      c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
      c.phone.includes(customerSearch)
  )

  const selectCustomer = (c: Customer) => {
    setSelectedCustomer(c)
    setCustomerSearch(c.name)
    setShowDropdown(false)
  }

  const clearSelection = () => {
    setSelectedCustomer(null)
    setCustomerSearch("")
    setShowDropdown(false)
  }

  const switchToNew = () => {
    setCustomerMode("new")
    setSelectedCustomer(null)
    setCustomerSearch("")
    setShowDropdown(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError("")

    let customerId: number

    if (customerMode === "existing") {
      if (!selectedCustomer) {
        setError("Please select a customer")
        setSaving(false)
        return
      }
      customerId = selectedCustomer.id
    } else {
      if (!newName.trim() || !newPhone.trim()) {
        setError("Name and phone are required for new customer")
        setSaving(false)
        return
      }
      try {
        const res = await fetch("/api/customers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: newName, phone: newPhone, email: newEmail || undefined }),
        })
        const data = await res.json()
        if (!res.ok) {
          setError(data.error || "Failed to create customer")
          setSaving(false)
          return
        }
        customerId = data.customer.id
      } catch {
        setError("Failed to create customer")
        setSaving(false)
        return
      }
    }

    const payload = {
      customerId,
      brand,
      model,
      imei: imei || undefined,
      passcode: passcode || undefined,
      problemCategory: category,
      problemDescription: description || undefined,
    }

    try {
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Failed to create ticket")
        setSaving(false)
        return
      }
      toast.success("Ticket created successfully")
      onSuccess()
    } catch {
      setError("Failed to create ticket")
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="rounded-lg border p-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">Customer</p>
          <div className="flex gap-1">
            <Button
              type="button"
              variant={customerMode === "existing" ? "default" : "outline"}
              size="sm"
              onClick={() => setCustomerMode("existing")}
            >
              <Search className="h-3 w-3 mr-1" />
              Existing
            </Button>
            <Button
              type="button"
              variant={customerMode === "new" ? "default" : "outline"}
              size="sm"
              onClick={switchToNew}
            >
              <Plus className="h-3 w-3 mr-1" />
              New
            </Button>
          </div>
        </div>

        {customerMode === "existing" ? (
          <div ref={searchRef} className="space-y-2 relative">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name or phone..."
                className="pl-9 pr-9"
                value={customerSearch}
                onChange={(e) => {
                  setCustomerSearch(e.target.value)
                  setSelectedCustomer(null)
                  setShowDropdown(true)
                }}
                onFocus={() => setShowDropdown(true)}
              />
              {selectedCustomer && (
                <button
                  type="button"
                  onClick={clearSelection}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {showDropdown && (
              <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-md">
                {customersLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                ) : filteredCustomers.length === 0 ? (
                  <div className="py-4 text-center text-sm text-muted-foreground">
                    No customers found.{" "}
                    <button type="button" onClick={switchToNew} className="text-primary underline">
                      Add new
                    </button>
                  </div>
                ) : (
                  <ul className="max-h-48 overflow-auto py-1">
                    {filteredCustomers.map((c) => (
                      <li key={c.id}>
                        <button
                          type="button"
                          className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm hover:bg-accent"
                          onClick={() => selectCustomer(c)}
                        >
                          <span className="flex-1 min-w-0">
                            <span className="font-medium truncate block">{c.name}</span>
                            <span className="text-muted-foreground text-xs">{c.phone}</span>
                          </span>
                          {selectedCustomer?.id === c.id && (
                            <Check className="h-4 w-4 text-primary shrink-0" />
                          )}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {selectedCustomer && (
              <div className="rounded-md bg-muted p-2 text-sm">
                <span className="font-medium">{selectedCustomer.name}</span>
                <span className="text-muted-foreground ml-2">— {selectedCustomer.phone}</span>
                {selectedCustomer.email && (
                  <span className="text-muted-foreground ml-2">({selectedCustomer.email})</span>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="newName">Full Name *</Label>
                <Input id="newName" value={newName} onChange={(e) => setNewName(e.target.value)} required={customerMode === "new"} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPhone">Phone *</Label>
                <Input id="newPhone" value={newPhone} onChange={(e) => setNewPhone(e.target.value)} required={customerMode === "new"} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="newEmail">Email</Label>
              <Input id="newEmail" type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} />
            </div>
          </div>
        )}
      </div>

      <div className="rounded-lg border p-4 space-y-3">
        <p className="text-sm font-medium">Device Information</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="brand">Brand *</Label>
            <Select value={brand} onValueChange={setBrand}>
              <SelectTrigger id="brand">
                <SelectValue placeholder="Select brand" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="apple">Apple</SelectItem>
                <SelectItem value="samsung">Samsung</SelectItem>
                <SelectItem value="xiaomi">Xiaomi</SelectItem>
                <SelectItem value="oppo">Oppo</SelectItem>
                <SelectItem value="vivo">Vivo</SelectItem>
                <SelectItem value="realme">Realme</SelectItem>
                <SelectItem value="tecno">Tecno</SelectItem>
                <SelectItem value="infinix">Infinix</SelectItem>
                <SelectItem value="huawei">Huawei</SelectItem>
                <SelectItem value="google">Google</SelectItem>
                <SelectItem value="oneplus">OnePlus</SelectItem>
                <SelectItem value="nokia">Nokia</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="model">Model *</Label>
            <Input id="model" placeholder="e.g. iPhone 15 Pro" value={model} onChange={(e) => setModel(e.target.value)} required />
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="imei">Serial / IMEI</Label>
            <Input id="imei" value={imei} onChange={(e) => setImei(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="passcode">Passcode / Pattern</Label>
            <Input id="passcode" value={passcode} onChange={(e) => setPasscode(e.target.value)} />
          </div>
        </div>
      </div>

      <div className="rounded-lg border p-4 space-y-3">
        <p className="text-sm font-medium">Issue Details</p>
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
          <Label htmlFor="description">Problem Description *</Label>
          <textarea
            id="description"
            className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 pt-4 border-t">
        <Button type="button" variant="outline" disabled={saving} onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={saving}>
          {saving ? (
            <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Creating...</>
          ) : (
            <><Plus className="h-4 w-4 mr-2" />Create Ticket</>
          )}
        </Button>
      </div>
    </form>
  )
}
