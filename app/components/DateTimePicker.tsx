"use client"

import { useState } from "react"
import { CalendarIcon, Clock, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

interface DateTimePickerProps {
  value: string // "YYYY-MM-DDTHH:mm" (empty = unset)
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

function split(value: string): { date: string; time: string } {
  if (!value) return { date: "", time: "" }
  const [d, t = ""] = value.split("T")
  return { date: d, time: t }
}

function join(date: string, time: string): string {
  if (!date && !time) return ""
  if (!time) return date
  if (!date) return time
  return `${date}T${time}`
}

function formatDisplay(value: string): string {
  if (!value) return ""
  const d = new Date(value)
  if (isNaN(d.getTime())) return value
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function epochToLocal(ts: number): string {
  const d = new Date(ts * 1000)
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`
}

export function DateTimePicker({
  value,
  onChange,
  placeholder = "Select date & time",
  className,
}: DateTimePickerProps) {
  const [open, setOpen] = useState(false)
  const { date, time } = split(value)

  const apply = (datePart: string, timePart: string) => {
    onChange(join(datePart, timePart))
  }

  const applyPreset = (label: string, deltaSeconds: number) => {
    onChange(epochToLocal(Math.floor(Date.now() / 1000) + deltaSeconds))
    void label
  }

  const presets: Array<{ label: string; delta: number }> = [
    { label: "Now", delta: 0 },
    { label: "+1 hr", delta: 3600 },
    { label: "+1 day", delta: 86400 },
    { label: "+1 week", delta: 7 * 86400 },
    { label: "+1 month", delta: 30 * 86400 },
  ]

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "h-9 justify-start gap-2 font-normal",
            !value && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
          {value ? formatDisplay(value) : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-3" align="start">
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="dt-date" className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <CalendarIcon className="h-3 w-3" /> Date
            </Label>
            <Input
              id="dt-date"
              type="date"
              value={date}
              onChange={(e) => apply(e.target.value, time)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="dt-time" className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" /> Time
            </Label>
            <Input
              id="dt-time"
              type="time"
              value={time}
              onChange={(e) => apply(date, e.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {presets.map((p) => (
              <Button
                key={p.label}
                variant="outline"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() => applyPreset(p.label, p.delta)}
              >
                {p.label}
              </Button>
            ))}
            {value && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs text-muted-foreground"
                onClick={() => onChange("")}
              >
                <X className="mr-1 h-3 w-3" /> Clear
              </Button>
            )}
          </div>
          <Button className="w-full" size="sm" onClick={() => setOpen(false)}>
            Done
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
