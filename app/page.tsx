import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Wrench, ClipboardList, Package, Receipt, ArrowRight } from "lucide-react"

export default function Home() {
  return (
    <>
      <Navbar />
      <main className="flex-1">
        <section className="relative overflow-hidden py-24 lg:py-32">
          <div className="container mx-auto px-4 text-center">
            <div className="mx-auto max-w-3xl space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border bg-muted px-4 py-1.5 text-sm text-muted-foreground">
                <Wrench className="h-4 w-4" />
                Professional Repair Management
              </div>
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                Mobile Repair Lab
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Streamline your device repair workflow — track tickets, manage inventory, 
                and generate invoices all in one place.
              </p>
              <div className="flex items-center justify-center gap-4">
                <Link href="/dashboard">
                  <Button size="lg">
                    Go to Dashboard
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/track">
                  <Button variant="outline" size="lg">
                    Track a Repair
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="border-t py-16">
          <div className="container mx-auto px-4">
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-xl border bg-card p-6 shadow-sm">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary mb-4">
                  <ClipboardList className="h-6 w-6" />
                </div>
                <h3 className="font-semibold mb-2">Ticket Management</h3>
                <p className="text-sm text-muted-foreground">
                  Create and track repair tickets through every stage — from received to completed.
                </p>
              </div>
              <div className="rounded-xl border bg-card p-6 shadow-sm">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary mb-4">
                  <Package className="h-6 w-6" />
                </div>
                <h3 className="font-semibold mb-2">Inventory Control</h3>
                <p className="text-sm text-muted-foreground">
                  Manage spare parts inventory with low-stock alerts and automatic deduction.
                </p>
              </div>
              <div className="rounded-xl border bg-card p-6 shadow-sm sm:col-span-2 lg:col-span-1">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary mb-4">
                  <Receipt className="h-6 w-6" />
                </div>
                <h3 className="font-semibold mb-2">Invoicing & Receipts</h3>
                <p className="text-sm text-muted-foreground">
                  Generate itemized invoices with parts and labor, plus printable PDF receipts.
                </p>
              </div>
            </div>
          </div>
        </section>

        <footer className="border-t py-8">
          <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Mobile Repair Lab. All rights reserved.
          </div>
        </footer>
      </main>
    </>
  )
}
