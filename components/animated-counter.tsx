"use client"

import { useEffect, useRef, useState } from "react"
import { useInView } from "framer-motion"

interface AnimatedCounterProps {
  from?: number
  to: number
  duration?: number
  className?: string
  prefix?: string
  suffix?: string
  decimals?: number
}

export function AnimatedCounter({
  from = 0,
  to,
  duration = 1.5,
  className,
  prefix = "",
  suffix = "",
  decimals = 0,
}: AnimatedCounterProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const isInView = useInView(ref, { once: true })
  const [displayed, setDisplayed] = useState(from)

  useEffect(() => {
    if (!isInView) return

    const startTime = performance.now()
    const range = to - from

    function animate(now: number) {
      const elapsed = (now - startTime) / 1000
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      const value = from + range * eased
      setDisplayed(decimals > 0 ? Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals) : Math.round(value))
      if (progress < 1) requestAnimationFrame(animate)
    }

    requestAnimationFrame(animate)
  }, [isInView, from, to, duration, decimals])

  return (
    <span ref={ref} className={className}>
      {prefix}
      {displayed}
      {suffix}
    </span>
  )
}
