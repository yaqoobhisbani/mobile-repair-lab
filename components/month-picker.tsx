"use client"

import * as React from "react"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

const months = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
]

interface MonthPickerProps {
  value: Date
  onChange: (date: Date) => void
  className?: string
}

export function MonthPicker({ value, onChange, className }: MonthPickerProps) {
  const [month, setMonth] = React.useState(value.getMonth())
  const [year, setYear] = React.useState(value.getFullYear())
  const [open, setOpen] = React.useState(false)

  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 11 }, (_, i) => currentYear - 5 + i)

  const handleConfirm = (selectedMonth: number) => {
    onChange(new Date(year, selectedMonth, 1))
    setOpen(false)
    setMonth(selectedMonth)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn("w-full justify-start text-left font-normal bg-transparent", className)}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {format(value, "MMMM yyyy")}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-4" align="start">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
              <SelectTrigger className="flex-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {years.map((y) => (
                  <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {months.map((m, i) => (
              <button
                key={m}
                type="button"
                onClick={() => handleConfirm(i)}
                className={cn(
                  "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  month === i
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-accent hover:text-accent-foreground"
                )}
              >
                {m.slice(0, 3)}
              </button>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
