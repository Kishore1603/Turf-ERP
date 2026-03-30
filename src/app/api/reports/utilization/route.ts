import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { format } from 'date-fns'

const SLOTS_PER_DAY = 34 // 17 hours × 2 (30-min slots)

// GET /api/reports/utilization?date_from=&date_to=
export async function GET(req: NextRequest) {
  const supabase = createAdminClient()
  const { searchParams } = new URL(req.url)

  const date_from = searchParams.get('date_from') ?? format(new Date(), 'yyyy-MM-dd')
  const date_to   = searchParams.get('date_to')   ?? format(new Date(), 'yyyy-MM-dd')

  // Get active turfs
  const { data: turfs } = await supabase.from('turfs').select('id, name').eq('is_active', true)

  // Get bookings in range
  const { data: bookings, error } = await supabase
    .from('bookings')
    .select('turf_id, duration_minutes')
    .gte('booking_date', date_from)
    .lte('booking_date', date_to)
    .neq('booking_status', 'cancelled')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const days = Math.max(1,
    Math.round((new Date(date_to).getTime() - new Date(date_from).getTime()) / 86400000) + 1
  )
  const totalSlotsPerTurf = SLOTS_PER_DAY * days

  const byTurf: Record<string, { count: number; totalMinutes: number }> = {}
  ;(bookings ?? []).forEach((b: any) => {
    if (!byTurf[b.turf_id]) byTurf[b.turf_id] = { count: 0, totalMinutes: 0 }
    byTurf[b.turf_id].count++
    byTurf[b.turf_id].totalMinutes += b.duration_minutes ?? 60
  })

  const result = (turfs ?? []).map((t: any) => {
    const stats      = byTurf[t.id] ?? { count: 0, totalMinutes: 0 }
    const bookedSlots = Math.ceil(stats.totalMinutes / 30) // 30-min slots
    return {
      turf_id:          t.id,
      turf_name:        t.name,
      booked_slots:     bookedSlots,
      total_slots:      totalSlotsPerTurf,
      utilization_pct:  totalSlotsPerTurf > 0 ? (bookedSlots / totalSlotsPerTurf) * 100 : 0,
      total_bookings:   stats.count,
      total_minutes:    stats.totalMinutes,
    }
  })

  const avg_utilization = result.length > 0
    ? result.reduce((s, r) => s + r.utilization_pct, 0) / result.length
    : 0

  return NextResponse.json({ data: result, avg_utilization, date_from, date_to })
}
