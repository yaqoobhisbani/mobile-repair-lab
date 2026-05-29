"use client"

import { usePrivacyMode } from "@/lib/privacy-mode-context"
import { type ReactNode } from "react"

interface PrivacyAmountProps {
  children: ReactNode
  as?: "span" | "div"
  className?: string
}

export function PrivacyAmount({ children, as: Tag = "span", className }: PrivacyAmountProps) {
  const { privacyMode } = usePrivacyMode()

  if (privacyMode) {
    return <Tag className={className}>***</Tag>
  }

  return <Tag className={className}>{children}</Tag>
}
