"use client"

import type { ReactNode } from "react"
import { cn } from "@/lib/utils"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"

const gradientClasses: Record<string, string> = {
  accounts: "bg-gradient-to-r from-blue-600 via-emerald-500 to-cyan-500",
  expenses: "bg-gradient-to-r from-rose-600 to-red-600",
  inventory: "bg-gradient-to-r from-amber-600 to-orange-600",
  customers: "bg-gradient-to-r from-violet-600 to-purple-600",
  default: "bg-gradient-to-r from-blue-500 via-emerald-500 to-cyan-500",
}

interface SlideOverProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  gradient?: keyof typeof gradientClasses
  children: ReactNode
}

export function SlideOver({ open, onOpenChange, title, description, gradient = "default", children }: SlideOverProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <div className={cn("absolute top-0 left-0 right-0 h-0.5", gradientClasses[gradient] ?? gradientClasses.default)} />
        <SheetHeader className="mb-6 pt-2">
          <SheetTitle>{title}</SheetTitle>
          {description && <SheetDescription>{description}</SheetDescription>}
        </SheetHeader>
        {children}
      </SheetContent>
    </Sheet>
  )
}
