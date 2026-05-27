"use client"

import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Wrench, ClipboardList, Package, Receipt, TrendingUp, ArrowRight, Star } from "lucide-react"
import { motion } from "framer-motion"

const features = [
  {
    icon: ClipboardList,
    title: "Ticket Management",
    description: "Create and track repair tickets through every stage — from received to completed with status history.",
    gradient: "from-blue-500 to-cyan-500",
  },
  {
    icon: Package,
    title: "Inventory Control",
    description: "Manage spare parts inventory with low-stock alerts and automatic deduction from ticket parts.",
    gradient: "from-amber-500 to-orange-500",
  },
  {
    icon: Receipt,
    title: "Invoicing & Receipts",
    description: "Generate itemized invoices with parts and labor, plus printable receipts for customers.",
    gradient: "from-emerald-500 to-green-500",
  },
  {
    icon: TrendingUp,
    title: "Profit Reports",
    description: "Track earnings from labor and parts with detailed profit reports and visual charts.",
    gradient: "from-violet-500 to-purple-500",
  },
]

const stats = [
  { label: "Active Tickets", value: "Tracked in real-time" },
  { label: "Parts Inventory", value: "Auto-deducted" },
  { label: "Customer History", value: "Full searchable log" },
  { label: "Financial Reports", value: "Profit & expense tracking" },
]

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <section className="relative overflow-hidden py-24 lg:py-36">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_center,_var(--tw-gradient-stops))] from-blue-500/10 via-transparent to-transparent" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_center,_var(--tw-gradient-stops))] from-indigo-500/5 via-transparent to-transparent" />

          <div className="container mx-auto px-4 text-center relative">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="mx-auto max-w-3xl space-y-6"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1, duration: 0.4 }}
                className="inline-flex items-center gap-2 rounded-full border bg-background/50 backdrop-blur-sm px-4 py-1.5 text-sm text-muted-foreground"
              >
                <Wrench className="h-4 w-4" />
                Professional Repair Management
              </motion.div>

              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl bg-gradient-to-r from-blue-600 via-cyan-500 to-indigo-600 bg-clip-text text-transparent">
                Mobile Repair Lab
              </h1>

              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Streamline your device repair workflow — track tickets, manage inventory,
                generate invoices, and monitor profits all in one place.
              </p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.4 }}
                className="flex items-center justify-center gap-4 flex-wrap"
              >
                <Link href="/dashboard">
                  <Button size="lg" className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/25">
                    Go to Dashboard
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/track">
                  <Button variant="outline" size="lg">
                    Track a Repair
                  </Button>
                </Link>
              </motion.div>
            </motion.div>
          </div>
        </section>

        <section className="border-t py-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold">Everything you need to run your repair shop</h2>
              <p className="text-muted-foreground mt-2">Powerful tools designed for mobile device repair businesses.</p>
            </div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              variants={{
                hidden: { opacity: 0 },
                visible: { transition: { staggerChildren: 0.1, delayChildren: 0.1 } },
              }}
              className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
            >
              {features.map((f) => {
                const Icon = f.icon
                return (
                  <motion.div
                    key={f.title}
                    variants={{
                      hidden: { opacity: 0, y: 20 },
                      visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
                    }}
                    className="group rounded-xl border bg-card p-6 shadow-sm hover:shadow-md transition-all hover:-translate-y-1"
                  >
                    <div className={`flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br ${f.gradient} text-white mb-4 shadow-sm`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <h3 className="font-semibold mb-2">{f.title}</h3>
                    <p className="text-sm text-muted-foreground">{f.description}</p>
                  </motion.div>
                )
              })}
            </motion.div>
          </div>
        </section>

        <section className="border-t bg-muted/30 py-16">
          <div className="container mx-auto px-4">
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {stats.map((s) => (
                <div key={s.label} className="text-center">
                  <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    {s.value.split(" ")[0]}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <footer className="border-t py-12">
          <div className="container mx-auto px-4">
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground font-bold text-xs">
                  MRL
                </div>
                <span className="font-semibold text-sm">Mobile Repair Lab</span>
              </div>
              <div className="flex items-center gap-6 text-sm text-muted-foreground">
                <Link href="/track" className="hover:text-foreground transition-colors">Track Repair</Link>
                <Link href="/dashboard" className="hover:text-foreground transition-colors">Dashboard</Link>
              </div>
              <p className="text-sm text-muted-foreground">
                &copy; {new Date().getFullYear()} Mobile Repair Lab. All rights reserved.
              </p>
            </div>
          </div>
        </footer>
      </main>
    </>
  )
}
