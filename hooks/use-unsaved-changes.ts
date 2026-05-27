"use client"

import { useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"

export function useUnsavedChanges(hasChanges: boolean) {
  const router = useRouter()

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (hasChanges) {
        e.preventDefault()
        e.returnValue = ""
      }
    }
    window.addEventListener("beforeunload", handler)
    return () => window.removeEventListener("beforeunload", handler)
  }, [hasChanges])

  useEffect(() => {
    if (!hasChanges) return

    const originalPush = router.push
    const originalReplace = router.replace

    const wrappedPush = (href: string) => {
      if (window.confirm("You have unsaved changes. Are you sure you want to leave?")) {
        originalPush(href)
      }
    }

    const wrappedReplace = (href: string) => {
      if (window.confirm("You have unsaved changes. Are you sure you want to leave?")) {
        originalReplace(href)
      }
    }

    router.push = wrappedPush as typeof router.push
    router.replace = wrappedReplace as typeof router.replace

    return () => {
      router.push = originalPush
      router.replace = originalReplace
    }
  }, [hasChanges, router])
}
