import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { generateBookingRef, calculateBookingAmount, calculateGST, timeToMinutes } from '@/lib/utils'

// GET /api/bookings
export async function GET(req: NextRequest) {
  const supabase = createAdminClient()
  const { searchParams } = new URL(req.url)

  const turf_id        = searchParams.get('turf_id')
  const booking_date   = searchParams.get('booking_date')
  const booking_status = searchParams.get('booking_status')
  const payment_status = searchParams.get('payment_status')
  const limit          = Number(searchParams.get('limit') ?? 50)
  const page           = Number(searchParams.get('page') ?? 1)

  let query = supabase
    .from('bookings')
    .select('*, turf:turfs(id,name), customer:customers(id,name,phone)', { count: 'exact' })
    .order('booking_date', { ascending: false })
    .order('start_time', { ascending: false })
    .range((page - 1) * limit, page * limit - 1)

  if (turf_id)        query = query.eq('turf_id', turf_id)
  if (booking_date)   query = query.eq('booking_date', booking_date)
  if (booking_status) query = query.eq('booking_status', booking_status)
  if (payment_status) query = query.eq('payment_status', payment_status)

  const { data, error, count } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data, total: count, page, limit })
}

// POST /api/bookings
export async function POST(req: NextRequest) {
  const supabase = createAdminClient()
  const body = await req.json()

  const {
    turf_id, customer_name, customer_phone, customer_email,
    booking_date, start_time, end_time, payment_method,
    sport_type, notes, is_walk_in,
  } = body

  // Validate required fields
  if (!turf_id || !customer_name || !customer_phone || !booking_date || !start_time || !end_time) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // Validate no overlap
  const { data: conflicts } = await supabase
    .from('bookings')
    .select('id')
    .eq('turf_id', turf_id)
    .eq('booking_date', booking_date)
    .neq('booking_status', 'cancelled')
    .or(`and(start_time.lt.${end_time},end_time.gt.${start_time})`)

  if (conflicts?.length) {
    return NextResponse.json({ error: 'Time slot is already booked for this turf' }, { status: 409 })
  }

  // Upsert customer
  let customerId: string
  const { data: existing } = await supabase
    .from('customers')
    .select('id')
    .eq('phone', customer_phone)
    .single()

  if (existing) {
    customerId = existing.id
  } else {
    const { data: newCust, error: custErr } = await supabase
      .from('customers')
      .insert({ name: customer_name, phone: customer_phone, email: customer_email ?? null })
      .select('id')
      .single()

    if (custErr) return NextResponse.json({ error: custErr.message }, { status: 500 })
    customerId = newCust.id
  }

  // Find applicable pricing rule
  const dayOfWeek = new Date(booking_date).getDay()
  const midMin = (timeToMinutes(start_time) + timeToMinutes(end_time)) / 2

  const { data: rules } = await supabase
    .from('pricing_rules')
    .select('*')
    .eq('turf_id', turf_id)
    .eq('is_active', true)
    .contains('days_of_week', [dayOfWeek])

  const rule = (rules ?? [])
    .filter((r: any) => timeToMinutes(r.start_time) <= midMin && timeToMinutes(r.end_time) >= midMin)
    .sort((a: any, b: any) => (+b.is_peak) - (+a.is_peak))[0]

  const pricePerHour = rule?.price_per_hour ?? 0
  const subtotal     = calculateBookingAmount(start_time, end_time, pricePerHour)
  const gstAmt       = calculateGST(subtotal)
  const totalAmt     = subtotal + gstAmt
  const durationMin  = timeToMinutes(end_time) - timeToMinutes(start_time)

  const { data: booking, error: bookingErr } = await supabase
    .from('bookings')
    .insert({
      booking_ref:     generateBookingRef(),
      turf_id,
      customer_id:     customerId,
      booking_date,
      start_time,
      end_time,
      duration_minutes: durationMin,
      total_amount:    totalAmt,
      gst_amount:      gstAmt,
      payment_method:  payment_method ?? 'venue',
      payment_status:  'pending',
      booking_status:  'confirmed',
      sport_type:      sport_type ?? null,
      notes:           notes ?? null,
      is_walk_in:      is_walk_in ?? false,
    })
    .select('*, turf:turfs(id,name), customer:customers(id,name,phone)')
    .single()

  if (bookingErr) return NextResponse.json({ error: bookingErr.message }, { status: 500 })
  return NextResponse.json({ data: booking, message: 'Booking created successfully' }, { status: 201 })
}

// PATCH /api/bookings  (cancel, update status)
export async function PATCH(req: NextRequest) {
  const supabase = createAdminClient()
  const body = await req.json()
  const { id, ...updates } = body

  if (!id) return NextResponse.json({ error: 'Booking ID required' }, { status: 400 })

  const { data, error } = await supabase
    .from('bookings')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}
