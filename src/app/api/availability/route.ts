import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { timeToMinutes } from '@/lib/utils'

// GET /api/availability?turf_id=&date=&start_time=&end_time=
export async function GET(req: NextRequest) {
  const supabase = createAdminClient()
  const { searchParams } = new URL(req.url)

  const turf_id    = searchParams.get('turf_id')
  const date       = searchParams.get('date')
  const start_time = searchParams.get('start_time')
  const end_time   = searchParams.get('end_time')

  if (!turf_id || !date) {
    return NextResponse.json({ error: 'turf_id and date are required' }, { status: 400 })
  }

  // Fetch all bookings for this turf on this date
  const { data: bookings, error } = await supabase
    .from('bookings')
    .select('start_time, end_time, booking_status, customer:customers(name)')
    .eq('turf_id', turf_id)
    .eq('booking_date', date)
    .neq('booking_status', 'cancelled')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // If specific slot requested, check if available
  if (start_time && end_time) {
    const reqStart = timeToMinutes(start_time)
    const reqEnd   = timeToMinutes(end_time)

    const conflict = (bookings ?? []).find((b: any) => {
      const bStart = timeToMinutes(b.start_time)
      const bEnd   = timeToMinutes(b.end_time)
      return reqStart < bEnd && reqEnd > bStart
    })

    return NextResponse.json({
      available: !conflict,
      conflict: conflict ? {
        start_time: conflict.start_time,
        end_time: conflict.end_time,
        customer: (conflict as any).customer?.name,
      } : null,
    })
  }

  // Return all booked slots for the day
  const bookedSlots = (bookings ?? []).map((b: any) => ({
    start_time: b.start_time,
    end_time:   b.end_time,
    status:     b.booking_status,
    customer:   b.customer?.name,
  }))

  // Generate free 30-min slots suggestion list
  const openTime  = 6 * 60   // 6 AM
  const closeTime = 23 * 60  // 11 PM
  const freeSlots: string[] = []

  for (let t = openTime; t < closeTime; t += 30) {
    const slotEnd = t + 30
    const occupied = (bookings ?? []).some((b: any) => {
      const bStart = timeToMinutes(b.start_time)
      const bEnd   = timeToMinutes(b.end_time)
      return t < bEnd && slotEnd > bStart
    })
    if (!occupied) {
      const h = Math.floor(t / 60)
      const m = t % 60
      freeSlots.push(`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`)
    }
  }

  // AI slot suggestion: suggest next 3 available slots
  const suggested = freeSlots.slice(0, 3)

  return NextResponse.json({
    date,
    turf_id,
    booked_slots: bookedSlots,
    free_slots:   freeSlots,
    suggested_slots: suggested,
  })
}
