import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import {
  format,
  parseISO,
  differenceInMinutes,
  addMinutes,
  isToday,
  isTomorrow,
  isYesterday,
} from 'date-fns'

// ─── Tailwind ────────────────────────────────────────────────
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ─── Currency ────────────────────────────────────────────────
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

// ─── Dates ───────────────────────────────────────────────────
export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, 'dd MMM yyyy')
}

export function formatDateShort(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, 'dd/MM/yy')
}

export function formatDateInput(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, 'yyyy-MM-dd')
}

export function formatRelativeDate(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  if (isToday(d)) return 'Today'
  if (isTomorrow(d)) return 'Tomorrow'
  if (isYesterday(d)) return 'Yesterday'
  return format(d, 'dd MMM yyyy')
}

// ─── Times ───────────────────────────────────────────────────
export function formatTime(time: string): string {
  const [h, m] = time.split(':').map(Number)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 || 12
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`
}

export function formatTimeRange(start: string, end: string): string {
  return `${formatTime(start)} – ${formatTime(end)}`
}

export function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

export function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

export function calculateDuration(start: string, end: string): number {
  return timeToMinutes(end) - timeToMinutes(start)
}

// ─── Pricing ─────────────────────────────────────────────────
export function calculateBookingAmount(
  start: string,
  end: string,
  pricePerHour: number
): number {
  const minutes = calculateDuration(start, end)
  return (minutes / 60) * pricePerHour
}

export function calculateGST(amount: number, gstRate = 18): number {
  return Math.round((amount * gstRate) / 100)
}

export function calculateTotal(amount: number, gstRate = 18): number {
  return amount + calculateGST(amount, gstRate)
}

// ─── ID Generators ───────────────────────────────────────────
export function generateBookingRef(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let ref = 'TRF-'
  for (let i = 0; i < 8; i++) {
    if (i === 4) ref += '-'
    ref += chars[Math.floor(Math.random() * chars.length)]
  }
  return ref
}

export function generateInvoiceNumber(): string {
  const year = new Date().getFullYear().toString().slice(-2)
  const month = String(new Date().getMonth() + 1).padStart(2, '0')
  const seq = String(Math.floor(Math.random() * 9000) + 1000)
  return `INV/${year}-${month}/${seq}`
}

// ─── Status Styles ───────────────────────────────────────────
export const statusStyles: Record<string, { bg: string; text: string; dot: string }> = {
  confirmed:  { bg: 'bg-emerald-500/15', text: 'text-emerald-400', dot: 'bg-emerald-400' },
  completed:  { bg: 'bg-sky-500/15',     text: 'text-sky-400',     dot: 'bg-sky-400'     },
  cancelled:  { bg: 'bg-red-500/15',     text: 'text-red-400',     dot: 'bg-red-400'     },
  paid:       { bg: 'bg-emerald-500/15', text: 'text-emerald-400', dot: 'bg-emerald-400' },
  pending:    { bg: 'bg-amber-500/15',   text: 'text-amber-400',   dot: 'bg-amber-400'   },
  failed:     { bg: 'bg-red-500/15',     text: 'text-red-400',     dot: 'bg-red-400'     },
  refunded:   { bg: 'bg-violet-500/15',  text: 'text-violet-400',  dot: 'bg-violet-400'  },
  online:     { bg: 'bg-cyan-500/15',    text: 'text-cyan-400',    dot: 'bg-cyan-400'    },
  venue:      { bg: 'bg-slate-500/15',   text: 'text-slate-400',   dot: 'bg-slate-400'   },
}

export function getStatusStyle(status: string) {
  return statusStyles[status] ?? { bg: 'bg-slate-500/15', text: 'text-slate-400', dot: 'bg-slate-400' }
}

// ─── Percentage ──────────────────────────────────────────────
export function formatPercent(value: number): string {
  return `${Math.round(value)}%`
}

export function formatChange(value: number): string {
  const sign = value >= 0 ? '+' : ''
  return `${sign}${value.toFixed(1)}%`
}

// ─── Day name ────────────────────────────────────────────────
export const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
export const DAY_NAMES_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

// ─── Time slots ──────────────────────────────────────────────
export function generateTimeSlots(
  startHour = 6,
  endHour = 23,
  intervalMinutes = 30
): string[] {
  const slots: string[] = []
  let current = startHour * 60
  const end = endHour * 60
  while (current < end) {
    slots.push(minutesToTime(current))
    current += intervalMinutes
  }
  return slots
}

// ─── Misc ────────────────────────────────────────────────────
export function truncate(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text
  return text.slice(0, maxLen - 1) + '…'
}

export function phoneFormat(phone: string): string {
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.length === 10) return `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`
  return phone
}
