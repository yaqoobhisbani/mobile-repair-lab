"use client"

import { createContext, useContext, useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"

interface User {
  email: string
  name: string
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const MOCK_USER: User = { email: "admin@example.com", name: "Admin" }

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem("mrl_auth")
    if (stored) {
      setUser(JSON.parse(stored))
    }
    setIsLoading(false)
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    await new Promise((r) => setTimeout(r, 800))

    if (email === "admin@example.com" && password === "password123") {
      setUser(MOCK_USER)
      localStorage.setItem("mrl_auth", JSON.stringify(MOCK_USER))
      return { success: true }
    }

    return { success: false, error: "Invalid email or password" }
  }, [])

  const logout = useCallback(() => {
    setUser(null)
    localStorage.removeItem("mrl_auth")
  }, [])

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}
