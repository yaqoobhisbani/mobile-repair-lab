"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">
            MRL
          </div>
          <span className="font-semibold text-lg hidden sm:inline">Mobile Repair Lab</span>
        </Link>

        <nav className="flex items-center gap-4">
          <Link href="/track" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Track Repair
          </Link>
          <Link href="/dashboard">
            <Button variant="default" size="sm">Dashboard</Button>
          </Link>
        </nav>
      </div>
    </header>
  )
}
