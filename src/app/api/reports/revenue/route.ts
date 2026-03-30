import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { format, subDays, eachDayOfInterval, parseISO } from 'date-fns'

// GET /api/reports/revenue?date_from=&date_to=&turf_id=
export async function GET(req: NextRequest) {
  const supabase = createAdminClient()
  const { searchParams } = new URL(req.url)

  const date_from = searchParams.get('date_from') ?? format(subDays(new Date(), 29), 'yyyy-MM-dd')
  const date_to   = searchParams.get('date_to')   ?? format(new Date(), 'yyyy-MM-dd')
  const turf_id   = searchParams.get('turf_id')

  let query = supabase
    .from('bookings')
    .select('booking_date, total_amount, payment_status, turf_id, turf:turfs(name)')
    .gte('booking_date', date_from)
    .lte('booking_date', date_to)
    .neq('booking_status', 'cancelled')

  if (turf_id) query = query.eq('turf_id', turf_id)

  const { data: bookings, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Aggregate by date
  const days = eachDayOfInterval({
    start: parseISO(date_from),
    end:   parseISO(date_to),
  })

  const byDate: Record<string, { date: string; revenue: number; bookings: number }> = {}
  days.forEach(day => {
    const key = format(day, 'yyyy-MM-dd')
    byDate[key] = { date: format(day, 'dd MMM'), revenue: 0, bookings: 0 }
  })

  let totalRevenue = 0
  let paidCount    = 0
  let pendingCount = 0

  ;(bookings ?? []).forEach((b: any) => {
    const key = b.booking_date
    if (byDate[key]) {
      byDate[key].bookings++
      if (b.payment_status === 'paid') {
        byDate[key].revenue += b.total_amount
        totalRevenue += b.total_amount
        paidCount++
      } else if (b.payment_status === 'pending') {
        pendingCount++
      }
    }
  })

  const totalBookings = bookings?.length ?? 0
  const avgPerBooking = paidCount > 0 ? totalRevenue / paidCount : 0

  return NextResponse.json({
    data:           Object.values(byDate),
    summary: {
      total_revenue:      totalRevenue,
      total_bookings:     totalBookings,
      paid_bookings:      paidCount,
      pending_bookings:   pendingCount,
      avg_per_booking:    avgPerBooking,
      date_from,
      date_to,
    },
  })
}
