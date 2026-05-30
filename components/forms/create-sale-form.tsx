"use client"

import { useState, useMemo, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Loader2, Plus, Search, Trash2, ShoppingCart, Check, X } from "lucide-react"
import { toast } from "sonner"
import { useInventory } from "@/hooks/queries/use-inventory"
import { useAccounts } from "@/hooks/queries/use-accounts"
import { PrivacyAmount } from "@/components/privacy-amount"
import { useCustomers } from "@/hooks/queries/use-customers"
import { useCreateCustomer } from "@/hooks/mutations/use-create-customer"
import { useCreateSale, type SaleItemInput } from "@/hooks/mutations/use-create-sale"

interface InventoryPart {
  id: number
  partName: string
  sku: string
  stockQty: number
  sellingPrice: string | null
}

interface CartItem {
  inventoryId: number
  partName: string
  sku: string
  quantity: number
  unitPrice: number
  availableStock: number
}

interface Customer {
  id: number
  name: string
  phone: string
  email: string | null
}

interface CreateSaleFormProps {
  onSuccess: () => void
  onCancel: () => void
}

export function CreateSaleForm({ onSuccess, onCancel }: CreateSaleFormProps) {
  const { data: parts = [], isLoading: partsLoading } = useInventory()
  const { data: accounts = [], isLoading: accountsLoading } = useAccounts()
  const { data: customers = [], isLoading: customersLoading } = useCustomers()
  const createCustomer = useCreateCustomer()
  const createSale = useCreateSale()

  const [cart, setCart] = useState<CartItem[]>([])
  const [selectedAccountId, setSelectedAccountId] = useState<string>("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  const [customerMode, setCustomerMode] = useState<"existing" | "new">("existing")
  const [customerSearch, setCustomerSearch] = useState("")
  const [showDropdown, setShowDropdown] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const searchRef = useRef<HTMLDivElement>(null)

  const [newName, setNewName] = useState("")
  const [newPhone, setNewPhone] = useState("")
  const [newEmail, setNewEmail] = useState("")
  const [saveAsCustomer, setSaveAsCustomer] = useState(true)

  const [partSearch, setPartSearch] = useState("")
  const [discountType, setDiscountType] = useState<string>("none")
  const [discountValue, setDiscountValue] = useState("")

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  const filteredParts = useMemo(() => {
    const q = partSearch.toLowerCase().trim()
    const inCart = new Set(cart.map((c) => c.inventoryId))
    return parts.filter(
      (p) => p.stockQty > 0 && !inCart.has(p.id) && (
        !q ||
        p.partName.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q)
      )
    )
  }, [partSearch, parts, cart])

  const filteredCustomers = customers.filter(
    (c: any) =>
      !customerSearch ||
      c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
      c.phone.includes(customerSearch)
  )

  const addToCart = (part: InventoryPart) => {
    setCart((prev) => [
      ...prev,
      {
        inventoryId: part.id,
        partName: part.partName,
        sku: part.sku,
        quantity: 1,
        unitPrice: parseFloat(part.sellingPrice ?? "0"),
        availableStock: part.stockQty,
      },
    ])
    setPartSearch("")
  }

  const updateQuantity = (inventoryId: number, quantity: number) => {
    setCart((prev) =>
      prev.map((item) =>
        item.inventoryId === inventoryId
          ? { ...item, quantity: Math.max(1, Math.min(quantity, item.availableStock)) }
          : item
      )
    )
  }

  const removeFromCart = (inventoryId: number) => {
    setCart((prev) => prev.filter((item) => item.inventoryId !== inventoryId))
  }

  const cartTotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0)
  }, [cart])

  const discountAmount = useMemo(() => {
    if (discountType === "percentage" && discountValue) {
      return cartTotal * parseFloat(discountValue) / 100
    }
    if (discountType === "amount" && discountValue) {
      return parseFloat(discountValue)
    }
    return 0
  }, [cartTotal, discountType, discountValue])

  const netTotal = useMemo(() => {
    return Math.max(0, cartTotal - discountAmount)
  }, [cartTotal, discountAmount])

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

    if (cart.length === 0) {
      setError("Add at least one item to the sale")
      setSaving(false)
      return
    }

    if (!selectedAccountId) {
      setError("Select a payment account")
      setSaving(false)
      return
    }

    let customerId: number | null = null
    let customerName: string | undefined
    let customerPhone: string | undefined

    if (customerMode === "existing") {
      if (selectedCustomer) {
        customerId = selectedCustomer.id
      }
    } else {
      if (newName.trim()) {
        customerName = newName.trim()
        customerPhone = newPhone.trim() || undefined
        if (saveAsCustomer) {
          try {
            const result = await createCustomer.mutateAsync({ name: newName, phone: newPhone || "N/A", email: newEmail || undefined })
            customerId = result.customer.id
          } catch {
            setError("Failed to create customer")
            setSaving(false)
            return
          }
        }
      }
    }

    const items: SaleItemInput[] = cart.map((item) => ({
      inventoryId: item.inventoryId,
      quantity: item.quantity,
    }))

    try {
      await createSale.mutateAsync({
        items,
        paymentAccountId: Number(selectedAccountId),
        customerId,
        customerName,
        customerPhone,
        discountType: discountType !== "none" ? discountType : null,
        discountValue: discountValue || null,
      })
      toast.success("Sale completed successfully")
      onSuccess()
    } catch (err: any) {
      setError(err?.message || "Failed to complete sale")
      setSaving(false)
    }
  }

  const loading = partsLoading || accountsLoading || customersLoading

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
                    {filteredCustomers.map((c: any) => (
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
                <span className="text-muted-foreground ml-2">{"\u2014"} {selectedCustomer.phone}</span>
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
                <Label htmlFor="newName">Full Name</Label>
                <Input id="newName" value={newName} onChange={(e) => setNewName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPhone">Phone</Label>
                <Input id="newPhone" value={newPhone} onChange={(e) => setNewPhone(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="newEmail">Email</Label>
              <Input id="newEmail" type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} />
            </div>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={saveAsCustomer}
                onChange={(e) => setSaveAsCustomer(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300"
              />
              Save as customer record
            </label>
          </div>
        )}
      </div>

      <div className="rounded-lg border p-4 space-y-3">
        <p className="text-sm font-medium">Items *</p>

        {loading ? (
          <div className="flex items-center justify-center py-4 text-muted-foreground">
            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
            Loading inventory...
          </div>
        ) : (
          <>
            <div className="space-y-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search parts by name or SKU..."
                  className="pl-9"
                  value={partSearch}
                  onChange={(e) => setPartSearch(e.target.value)}
                />
              </div>

              {partSearch && filteredParts.length > 0 && (
                <div className="max-h-40 overflow-y-auto rounded-md border space-y-1 p-1">
                  {filteredParts.map((part) => (
                    <button
                      key={part.id}
                      type="button"
                      className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm hover:bg-accent transition-colors"
                      onClick={() => addToCart(part)}
                    >
                      <div className="flex-1 min-w-0">
                        <span className="font-medium block truncate">{part.partName}</span>
                        <span className="text-xs text-muted-foreground">{part.sku}</span>
                      </div>
                      <div className="text-right text-xs shrink-0">
                        <div>{part.sellingPrice ? <PrivacyAmount>Rs. {part.sellingPrice}</PrivacyAmount> : "\u2014"}</div>
                        <div>Stock: {part.stockQty}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {partSearch && filteredParts.length === 0 && (
                <p className="text-sm text-muted-foreground py-2">No matching parts in stock.</p>
              )}
            </div>

            {cart.length > 0 ? (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead className="text-right w-24">Qty</TableHead>
                      <TableHead className="text-right w-24">Price</TableHead>
                      <TableHead className="text-right w-24">Total</TableHead>
                      <TableHead className="w-10" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cart.map((item) => (
                      <TableRow key={item.inventoryId}>
                        <TableCell>
                          <p className="font-medium text-sm">{item.partName}</p>
                          <p className="text-xs text-muted-foreground">{item.sku}</p>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              className="h-7 w-7"
                              disabled={item.quantity <= 1}
                              onClick={() => updateQuantity(item.inventoryId, item.quantity - 1)}
                            >
                              -
                            </Button>
                            <span className="w-6 text-center text-sm tabular-nums">{item.quantity}</span>
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              className="h-7 w-7"
                              disabled={item.quantity >= item.availableStock}
                              onClick={() => updateQuantity(item.inventoryId, item.quantity + 1)}
                            >
                              +
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell className="text-right text-sm"><PrivacyAmount>Rs. {item.unitPrice.toFixed(2)}</PrivacyAmount></TableCell>
                        <TableCell className="text-right text-sm font-medium">
                          <PrivacyAmount>Rs. {(item.unitPrice * item.quantity).toFixed(2)}</PrivacyAmount>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeFromCart(item.inventoryId)}>
                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-6 text-muted-foreground">
                <ShoppingCart className="h-8 w-8 mb-2" />
                <p className="text-sm">Search and add items to the sale</p>
              </div>
            )}
          </>
        )}
      </div>

      <div className="rounded-lg border p-4 space-y-3">
        <p className="text-sm font-medium">Discount</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="discountType">Type</Label>
            <Select value={discountType} onValueChange={(v) => { setDiscountType(v); setDiscountValue("") }}>
              <SelectTrigger id="discountType">
                <SelectValue placeholder="No discount" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="percentage">Percentage (%)</SelectItem>
                <SelectItem value="amount">Amount (Rs.)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {discountType !== "none" && (
            <div className="space-y-2">
              <Label htmlFor="discountValue">
                {discountType === "percentage" ? "Percentage" : "Amount (Rs.)"}
              </Label>
              <Input
                id="discountValue"
                type="number"
                min="0"
                step={discountType === "percentage" ? "1" : "0.01"}
                placeholder={discountType === "percentage" ? "10" : "100"}
                value={discountValue}
                onChange={(e) => setDiscountValue(e.target.value)}
              />
            </div>
          )}
        </div>
      </div>

      <div className="rounded-lg border p-4 space-y-3">
        <p className="text-sm font-medium">Payment</p>
        <div className="space-y-2">
          <Label htmlFor="account">Account *</Label>
          <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
            <SelectTrigger id="account">
              <SelectValue placeholder="Select account" />
            </SelectTrigger>
            <SelectContent>
              {accounts.map((a: any) => (
                <SelectItem key={a.id} value={String(a.id)}>
                  {a.name} ({a.type === "cash" ? "Cash" : "Bank"}) {"\u2014"} <PrivacyAmount>Rs. {parseFloat(a.balance).toLocaleString()}</PrivacyAmount>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {cart.length > 0 && (
        <div className="rounded-lg bg-gradient-to-r from-orange-50 to-rose-50 dark:from-orange-950/30 dark:to-rose-950/30 p-4">
          <div className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span>Subtotal</span>
              <span><PrivacyAmount>Rs. {cartTotal.toFixed(2)}</PrivacyAmount></span>
            </div>
            {discountAmount > 0 && (
              <div className="flex items-center justify-between text-sm text-green-600">
                <span>Discount</span>
                <span>- <PrivacyAmount>Rs. {discountAmount.toFixed(2)}</PrivacyAmount></span>
              </div>
            )}
            <div className="flex items-center justify-between pt-1 border-t">
              <span className="text-sm font-medium">Total Amount</span>
              <span className="text-xl font-bold bg-gradient-to-r from-orange-600 to-rose-600 bg-clip-text text-transparent">
                <PrivacyAmount>Rs. {netTotal.toFixed(2)}</PrivacyAmount>
              </span>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="flex items-center justify-end gap-3 pt-4 border-t">
        <Button type="button" variant="outline" disabled={saving} onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={saving || cart.length === 0 || !selectedAccountId}>
          {saving ? (
            <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Processing...</>
          ) : (
            <><ShoppingCart className="h-4 w-4 mr-2" />Complete Sale (<PrivacyAmount>Rs. {netTotal.toFixed(2)}</PrivacyAmount>)</>
          )}
        </Button>
      </div>
    </form>
  )
}
