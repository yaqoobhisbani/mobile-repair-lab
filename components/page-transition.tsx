"use client"

import { motion, type Variants } from "framer-motion"
import { type ReactNode } from "react"

const fadeIn: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } },
}

export function PageTransition({ children }: { children: ReactNode }) {
  return (
    <motion.div className="min-w-0" initial="hidden" animate="visible" variants={fadeIn}>
      {children}
    </motion.div>
  )
}

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05, delayChildren: 0.1 },
  },
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.25, ease: "easeOut" } },
}

export function StaggerContainer({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div className={`min-w-0 ${className ?? ""}`} initial="hidden" animate="visible" variants={containerVariants}>
      {children}
    </motion.div>
  )
}

export function StaggerItem({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div className={className} variants={itemVariants}>
      {children}
    </motion.div>
  )
}

export function HoverCard({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      className={className}
      whileHover={{ scale: 1.015, transition: { duration: 0.15 } }}
      whileTap={{ scale: 0.985 }}
    >
      {children}
    </motion.div>
  )
}
