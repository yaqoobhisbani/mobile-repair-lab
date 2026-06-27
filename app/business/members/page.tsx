"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DataTablePagination } from "@/components/data-table-pagination"
import { Plus, Search, X, Pencil, Trash2, Eye, Users, Loader2, UserPlus, IdCard } from "lucide-react"
import { PageTransition } from "@/components/page-transition"
import { AnimatedCounter } from "@/components/animated-counter"
import { PrivacyAmount } from "@/components/privacy-amount"
import { toast } from "sonner"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/empty-state"
import { SlideOver } from "@/components/slide-over"
import { useConfirm } from "@/hooks/use-confirm"
import { useBusinessMembers } from "@/hooks/queries/use-business-members"
import { useCreateBusinessMember } from "@/hooks/mutations/use-create-business-member"
import { useUpdateBusinessMember } from "@/hooks/mutations/use-update-business-member"
import { useDeleteBusinessMember } from "@/hooks/mutations/use-delete-business-member"
import { useNavPrice } from "@/hooks/queries/use-nav-price"

export default function MembersPage() {
  const router = useRouter()
  const { data: members = [], isLoading } = useBusinessMembers()
  const navPrice = useNavPrice()
  const createMember = useCreateBusinessMember()
  const updateMember = useUpdateBusinessMember()
  const deleteMember = useDeleteBusinessMember()
  const { confirm, dialog: confirmDialog } = useConfirm()

  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [slideOverOpen, setSlideOverOpen] = useState(false)
  const [editingMember, setEditingMember] = useState<any>(null)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({ name: "", email: "", phone: "", role: "partner" })

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    if (!q) return members
    return members.filter((m) =>
      m.name.toLowerCase().includes(q) ||
      (m.email ?? "").toLowerCase().includes(q) ||
      (m.phone ?? "").includes(q)
    )
  }, [search, members])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const safePage = Math.min(page, totalPages)
  const paginated = filtered.slice((safePage - 1) * pageSize, safePage * pageSize)

  function openCreateDialog() {
    setEditingMember(null)
    setFormData({ name: "", email: "", phone: "", role: "partner" })
    setSlideOverOpen(true)
  }

  function openEditDialog(member: any) {
    setEditingMember(member)
    setFormData({
      name: member.name,
      email: member.email ?? "",
      phone: member.phone ?? "",
      role: member.role,
    })
    setSlideOverOpen(true)
  }

  function closeSlide() {
    setSlideOverOpen(false)
    setEditingMember(null)
  }

  async function handleSave() {
    if (!formData.name.trim()) {
      toast.error("Name is required")
      return
    }
    setSaving(true)
    try {
      if (editingMember) {
        await updateMember.mutateAsync({ id: editingMember.id, ...formData })
        toast.success("Member updated")
      } else {
        await createMember.mutateAsync(formData)
        toast.success("Member created")
      }
      closeSlide()
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: number, name: string) {
    const ok = await confirm({
      title: "Delete Member",
      description: `Remove ${name} from the business? They must not hold any shares or assets.`,
      variant: "destructive",
    })
    if (!ok) return
    deleteMember.mutate(id, {
      onSuccess: () => toast.success("Member deleted"),
      onError: (e) => toast.error(e.message),
    })
  }

  function formatDate(d: string) {
    return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
  }

  return (
    <PageTransition>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            {isLoading ? (
              <>
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-4 w-64 mt-2" />
              </>
            ) : (
              <>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">Members</h1>
                <p className="text-sm text-muted-foreground">Manage business partners, owners, and investors.</p>
              </>
            )}
          </div>
          <Button onClick={openCreateDialog}>
            <Plus className="h-4 w-4 mr-2" />
            Add Member
          </Button>
        </div>

        {!isLoading && members.length > 0 && (
          <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
            <Card className="bg-gradient-to-br from-violet-50 to-white dark:from-violet-950/60 dark:to-background border-violet-100 dark:border-violet-900/50">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Members</CardTitle>
                <Users className="h-4 w-4 text-violet-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold"><AnimatedCounter to={members.length} /></div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/60 dark:to-background border-blue-100 dark:border-blue-900/50">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Owners</CardTitle>
                <IdCard className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  <AnimatedCounter to={members.filter((m) => m.role === "owner").length} />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-950/60 dark:to-background border-emerald-100 dark:border-emerald-900/50">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Partners</CardTitle>
                <UserPlus className="h-4 w-4 text-emerald-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  <AnimatedCounter to={members.filter((m) => m.role === "partner").length} />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-amber-50 to-white dark:from-amber-950/60 dark:to-background border-amber-100 dark:border-amber-900/50">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Investors</CardTitle>
                <UserPlus className="h-4 w-4 text-amber-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  <AnimatedCounter to={members.filter((m) => m.role === "investor").length} />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by name, email, or phone..."
                  className="pl-9"
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                />
              </div>
              {search && (
                <Button variant="ghost" size="sm" onClick={() => { setSearch(""); setPage(1) }}>
                  <X className="h-4 w-4 mr-1" />
                  Clear
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
              </div>
            ) : filtered.length === 0 ? (
              <EmptyState
                icon={Users}
                title="No members found"
                description={search ? "No members match your search." : "No business members added yet."}
                action={!search ? <Button onClick={openCreateDialog}><Plus className="h-4 w-4 mr-2" />Add Member</Button> : undefined}
              />
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Joined</TableHead>
                        <TableHead className="text-right">Shares</TableHead>
                        <TableHead className="text-right">Equity Value</TableHead>
                        <TableHead className="text-right">Assets</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginated.map((member) => (
                        <TableRow key={member.id}>
                          <TableCell className="font-medium">{member.name}</TableCell>
                          <TableCell>{member.email ?? "—"}</TableCell>
                          <TableCell>{member.phone ?? "—"}</TableCell>
                          <TableCell>
                            <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-primary/10 text-primary capitalize">
                              {member.role}
                            </span>
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">{formatDate(member.createdAt)}</TableCell>
                          <TableCell className="text-right">{parseFloat(member.sharesOwned).toFixed(2)}</TableCell>
                          <TableCell className="text-right">
                            <PrivacyAmount>Rs. {(parseFloat(member.sharesOwned) * navPrice).toLocaleString()}</PrivacyAmount>
                          </TableCell>
                          <TableCell className="text-right">{member.assetCount ?? 0}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => router.push(`/business/members/${member.id}`)}>
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditDialog(member)}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleDelete(member.id, member.name)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <DataTablePagination
                  currentPage={safePage}
                  totalPages={totalPages}
                  totalItems={filtered.length}
                  pageSize={pageSize}
                  onPageChange={setPage}
                  onPageSizeChange={setPageSize}
                />
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <SlideOver
        open={slideOverOpen}
        onOpenChange={(open) => { if (!open) closeSlide() }}
        title={editingMember ? "Edit Member" : "Add Member"}
        description={editingMember ? "Update member details." : "Add a new partner, owner, or investor."}
        gradient="members"
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Full name" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="email@example.com" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="+92 300 1234567" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select value={formData.role} onValueChange={(v) => setFormData({ ...formData, role: v })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="owner">Owner</SelectItem>
                <SelectItem value="partner">Partner</SelectItem>
                <SelectItem value="investor">Investor</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={closeSlide}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingMember ? "Update" : "Create"}
            </Button>
          </div>
        </div>
      </SlideOver>

      {confirmDialog}
    </PageTransition>
  )
}
