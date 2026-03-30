'use client'

import { useState, useCallback, useRef } from 'react'
import { format, addDays, subDays, startOfWeek, parseISO, isSameDay } from 'date-fns'
import { ChevronLeft, ChevronRight, Plus, Clock } from 'lucide-react'
import type { Booking } from '@/types'
import { formatTime, formatCurrency, cn } from '@/lib/utils'

const HOUR_START = 6   // 6 AM
const HOUR_END   = 23  // 11 PM
const HOURS = Array.from({ length: HOUR_END - HOUR_START }, (_, i) => HOUR_START + i)
const HOUR_HEIGHT = 64 // px per hour

interface Props {
  bookings: Booking[]
  turfs: { id: string; name: string }[]
  selectedTurfId?: string
  onSlotClick: (date: string, time: string) => void
  onBookingClick: (booking: Booking) => void
  loading?: boolean
}

const TURF_COLORS: Record<number, { bg: string; bar: string; text: string }> = {
  0: { bg: 'bg-cyan-500/20',    bar: 'bg-cyan-500',    text: 'text-cyan-300'   },
  1: { bg: 'bg-violet-500/20',  bar: 'bg-violet-500',  text: 'text-violet-300' },
  2: { bg: 'bg-emerald-500/20', bar: 'bg-emerald-500', text: 'text-emerald-300'},
  3: { bg: 'bg-amber-500/20',   bar: 'bg-amber-500',   text: 'text-amber-300'  },
}

function timeToOffsetPx(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return ((h - HOUR_START) * 60 + m) * (HOUR_HEIGHT / 60)
}

function durationToPx(startTime: string, endTime: string): number {
  const [sh, sm] = startTime.split(':').map(Number)
  const [eh, em] = endTime.split(':').map(Number)
  const minutes = (eh * 60 + em) - (sh * 60 + sm)
  return minutes * (HOUR_HEIGHT / 60)
}

export function BookingCalendar({ bookings, turfs, selectedTurfId, onSlotClick, onBookingClick, loading }: Props) {
  const [currentWeekStart, setCurrentWeekStart] = useState(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 }) // Monday
  )
  const [view, setView] = useState<'week' | 'day'>('week')
  const [selectedDay, setSelectedDay] = useState(new Date())
  const gridRef = useRef<HTMLDivElement>(null)

  const days = view === 'week'
    ? Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i))
    : [selectedDay]

  const navigate = useCallback((dir: 1 | -1) => {
    if (view === 'week') {
      setCurrentWeekStart(prev => addDays(prev, dir * 7))
    } else {
      setSelectedDay(prev => addDays(prev, dir))
    }
  }, [view])

  const filteredBookings = selectedTurfId
    ? bookings.filter(b => b.turf_id === selectedTurfId)
    : bookings

  const turfColorIndex: Record<string, number> = {}
  turfs.forEach((t, idx) => { turfColorIndex[t.id] = idx })

  function handleGridClick(e: React.MouseEvent, date: Date) {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const relY = e.clientY - rect.top
    const totalMinutes = Math.round((relY / HOUR_HEIGHT) * 60)
    const hour = HOUR_START + Math.floor(totalMinutes / 60)
    const minute = Math.round((totalMinutes % 60) / 30) * 30
    const time = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
    onSlotClick(format(date, 'yyyy-MM-dd'), time)
  }

  const headerRange = view === 'week'
    ? `${format(currentWeekStart, 'dd MMM')} – ${format(addDays(currentWeekStart, 6), 'dd MMM yyyy')}`
    : format(selectedDay, 'dd MMMM yyyy')

  return (
    <div className="glass-card rounded-2xl overflow-hidden flex flex-col">
      {/* ── Calendar Toolbar ────────────────────────────────── */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.06] flex-shrink-0">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(-1)}
            className="p-1.5 rounded-lg hover:bg-white/[0.06] text-slate-400 hover:text-slate-200 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))
              setSelectedDay(new Date())
            }}
            className="px-2.5 py-1 rounded-lg text-xs text-slate-400 hover:bg-white/[0.06] hover:text-slate-200 transition-colors"
          >
            Today
          </button>
          <button
            onClick={() => navigate(1)}
            className="p-1.5 rounded-lg hover:bg-white/[0.06] text-slate-400 hover:text-slate-200 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <span className="text-sm font-medium text-slate-200 ml-1">{headerRange}</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Turf legend */}
          <div className="hidden md:flex items-center gap-3 mr-3">
            {turfs.map((t, idx) => (
              <span key={t.id} className="flex items-center gap-1.5 text-xs text-slate-500">
                <span className="w-2.5 h-2.5 rounded-sm" style={{
                  background: ['#06b6d4','#8b5cf6','#10b981','#f59e0b'][idx % 4]
                }} />
                {t.name}
              </span>
            ))}
          </div>

          {/* View toggle */}
          <div className="flex items-center bg-white/[0.04] rounded-lg border border-white/[0.08] overflow-hidden text-xs">
            {(['week', 'day'] as const).map(v => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={cn(
                  'px-3 py-1.5 capitalize transition-colors',
                  view === v
                    ? 'bg-cyan-500/20 text-cyan-400'
                    : 'text-slate-500 hover:text-slate-300'
                )}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Day headers ─────────────────────────────────────── */}
      <div
        className="grid border-b border-white/[0.06]"
        style={{ gridTemplateColumns: `64px repeat(${days.length}, 1fr)` }}
      >
        <div className="py-2 px-3" /> {/* time gutter */}
        {days.map((day) => {
          const isToday = isSameDay(day, new Date())
          return (
            <div
              key={day.toISOString()}
              className={cn(
                'py-2.5 text-center border-l border-white/[0.04] cursor-pointer select-none',
                isToday ? 'bg-cyan-500/5' : '',
              )}
              onClick={() => { setView('day'); setSelectedDay(day) }}
            >
              <p className="text-[10px] text-slate-500 uppercase tracking-widest">
                {format(day, 'EEE')}
              </p>
              <p className={cn(
                'text-sm font-semibold mt-0.5',
                isToday ? 'text-cyan-400' : 'text-slate-300',
              )}>
                {format(day, 'd')}
              </p>
            </div>
          )
        })}
      </div>

      {/* ── Time Grid ───────────────────────────────────────── */}
      <div className="overflow-y-auto flex-1" style={{ maxHeight: 'calc(100vh - 340px)' }} ref={gridRef}>
        <div
          className="grid relative"
          style={{ gridTemplateColumns: `64px repeat(${days.length}, 1fr)` }}
        >
          {/* Time labels */}
          <div className="sticky left-0 z-10 bg-[#07091a]">
            {HOURS.map((h) => (
              <div
                key={h}
                className="flex items-start justify-end pr-3 text-[10px] text-slate-600"
                style={{ height: HOUR_HEIGHT }}
              >
                <span className="mt-[-6px]">
                  {h === 12 ? '12 PM' : h > 12 ? `${h-12} PM` : `${h} AM`}
                </span>
              </div>
            ))}
          </div>

          {/* Day columns */}
          {days.map((day, dayIdx) => {
            const dateStr = format(day, 'yyyy-MM-dd')
            const dayBookings = filteredBookings.filter(b => b.booking_date === dateStr)
            const isToday = isSameDay(day, new Date())

            return (
              <div
                key={dateStr}
                className={cn(
                  'relative border-l border-white/[0.04] cursor-pointer select-none',
                  isToday ? 'bg-cyan-500/[0.02]' : '',
                )}
                style={{ height: HOURS.length * HOUR_HEIGHT }}
                onClick={(e) => handleGridClick(e, day)}
              >
                {/* Hour lines */}
                {HOURS.map((h) => (
                  <div
                    key={h}
                    className="absolute left-0 right-0 border-t border-white/[0.04]"
                    style={{ top: (h - HOUR_START) * HOUR_HEIGHT }}
                  />
                ))}

                {/* Half-hour lines */}
                {HOURS.map((h) => (
                  <div
                    key={`${h}-half`}
                    className="absolute left-0 right-0 border-t border-white/[0.025] border-dashed"
                    style={{ top: (h - HOUR_START) * HOUR_HEIGHT + HOUR_HEIGHT / 2 }}
                  />
                ))}

                {/* Current time indicator (today only) */}
                {isToday && (() => {
                  const now = new Date()
                  const top = ((now.getHours() - HOUR_START) * 60 + now.getMinutes()) * (HOUR_HEIGHT / 60)
                  if (top < 0 || top > HOURS.length * HOUR_HEIGHT) return null
                  return (
                    <div
                      className="absolute left-0 right-0 z-20 pointer-events-none"
                      style={{ top }}
                    >
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-red-400 ml-1" />
                        <div className="flex-1 h-px bg-red-400/60" />
                      </div>
                    </div>
                  )
                })()}

                {/* Booking blocks */}
                {dayBookings.map((booking) => {
                  const topPx = timeToOffsetPx(booking.start_time)
                  const heightPx = Math.max(durationToPx(booking.start_time, booking.end_time), 24)
                  const colorIdx = turfColorIndex[booking.turf_id] ?? 0
                  const colors = TURF_COLORS[colorIdx]
                  const isCancelled = booking.booking_status === 'cancelled'

                  return (
                    <div
                      key={booking.id}
                      className={cn(
                        'absolute left-1 right-1 rounded-lg border border-white/10 overflow-hidden cursor-pointer z-10 hover:z-20 group transition-transform hover:scale-[1.02]',
                        colors.bg,
                        isCancelled ? 'opacity-40' : '',
                      )}
                      style={{ top: topPx, height: heightPx }}
                      onClick={(e) => { e.stopPropagation(); onBookingClick(booking) }}
                    >
                      <div className={cn('w-1 h-full absolute left-0 top-0', colors.bar)} />
                      <div className="pl-2.5 pr-1.5 pt-1 pb-1">
                        <p className={cn('text-[11px] font-semibold leading-tight truncate', colors.text)}>
                          {booking.customer?.name ?? 'Unknown'}
                        </p>
                        {heightPx > 36 && (
                          <p className="text-[10px] text-slate-500 mt-0.5">
                            {formatTime(booking.start_time)} · {formatCurrency(booking.total_amount)}
                          </p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
