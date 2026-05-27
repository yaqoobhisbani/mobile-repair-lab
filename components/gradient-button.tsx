"use client"

import { forwardRef } from "react"
import { Button, type ButtonProps } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const gradientMap: Record<string, string> = {
  default: "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-sm shadow-blue-500/20 border-0",
  destructive: "bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white shadow-sm shadow-rose-500/20 border-0",
  success: "bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white shadow-sm shadow-emerald-500/20 border-0",
  warning: "bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white shadow-sm shadow-amber-500/20 border-0",
}

export interface GradientButtonProps extends ButtonProps {
  gradientVariant?: "default" | "destructive" | "success" | "warning"
}

export const GradientButton = forwardRef<HTMLButtonElement, GradientButtonProps>(
  ({ className, gradientVariant, variant, ...props }, ref) => {
    const gv = gradientVariant ?? (variant as string) ?? "default"
    const gradientClass = gradientMap[gv]
    if (!gradientClass || variant === "outline" || variant === "ghost" || variant === "link" || variant === "secondary") {
      return <Button ref={ref} className={className} variant={variant} {...props} />
    }
    return <Button ref={ref} className={cn(gradientClass, className)} variant={undefined} {...props} />
  }
)
GradientButton.displayName = "GradientButton"
