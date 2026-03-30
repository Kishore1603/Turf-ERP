import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { generateInvoiceNumber } from '@/lib/utils'

// GET /api/invoices?booking_id=
export async function GET(req: NextRequest) {
  const supabase = createAdminClient()
  const { searchParams } = new URL(req.url)
  const booking_id = searchParams.get('booking_id')

  let query = supabase
    .from('invoices')
    .select('*, booking:bookings(*, turf:turfs(name), customer:customers(name,phone,email))')
    .order('generated_at', { ascending: false })

  if (booking_id) query = query.eq('booking_id', booking_id)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

// POST /api/invoices  — generate invoice for a booking
export async function POST(req: NextRequest) {
  const supabase = createAdminClient()
  const body = await req.json()
  const { booking_id, customer_gstin } = body

  if (!booking_id) return NextResponse.json({ error: 'booking_id is required' }, { status: 400 })

  // Check if invoice already exists
  const { data: existing } = await supabase
    .from('invoices')
    .select('id, invoice_number')
    .eq('booking_id', booking_id)
    .single()

  if (existing) {
    return NextResponse.json({ data: existing, message: 'Invoice already exists' })
  }

  // Fetch booking details
  const { data: booking, error: bookingErr } = await supabase
    .from('bookings')
    .select('*, turf:turfs(name), customer:customers(name,phone,email)')
    .eq('id', booking_id)
    .single()

  if (bookingErr || !booking) {
    return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
  }

  const gstRate    = Number(process.env.NEXT_PUBLIC_GST_RATE ?? 18)
  const subtotal   = booking.total_amount - booking.gst_amount
  const gstAmt     = booking.gst_amount

  const invoiceData = {
    booking_id,
    invoice_number:  generateInvoiceNumber(),
    subtotal,
    gst_rate:        gstRate,
    gst_amount:      gstAmt,
    total_amount:    booking.total_amount,
    business_name:   process.env.NEXT_PUBLIC_BUSINESS_NAME ?? 'TurfPro',
    business_gstin:  process.env.NEXT_PUBLIC_BUSINESS_GSTIN ?? null,
    customer_gstin:  customer_gstin ?? null,
    generated_at:    new Date().toISOString(),
  }

  const { data: invoice, error: invoiceErr } = await supabase
    .from('invoices')
    .insert(invoiceData)
    .select()
    .single()

  if (invoiceErr) return NextResponse.json({ error: invoiceErr.message }, { status: 500 })

  return NextResponse.json({
    data: { ...invoice, booking },
    message: 'Invoice generated successfully',
  }, { status: 201 })
}
