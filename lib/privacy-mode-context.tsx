"use client"

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"

const STORAGE_KEY = "privacy-mode"

interface PrivacyModeContextValue {
  privacyMode: boolean
  toggle: () => void
}

const PrivacyModeContext = createContext<PrivacyModeContextValue | undefined>(undefined)

export function PrivacyModeProvider({ children }: { children: ReactNode }) {
  const [privacyMode, setPrivacyMode] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === "true") {
      setPrivacyMode(true)
    }
  }, [])

  const toggle = useCallback(() => {
    setPrivacyMode((prev) => {
      const next = !prev
      localStorage.setItem(STORAGE_KEY, String(next))
      return next
    })
  }, [])

  return (
    <PrivacyModeContext.Provider value={{ privacyMode, toggle }}>
      {children}
    </PrivacyModeContext.Provider>
  )
}

export function usePrivacyMode() {
  const ctx = useContext(PrivacyModeContext)
  if (!ctx) {
    throw new Error("usePrivacyMode must be used within PrivacyModeProvider")
  }
  return ctx
}
