import { NextRequest, NextResponse } from 'next/server'
import Razorpay from 'razorpay'
import { createAdminClient } from '@/lib/supabase'
import { getRazorpayConfig } from '@/lib/razorpay'

// POST /api/payments/create-order
export async function POST(req: NextRequest) {
  const supabase = createAdminClient()
  const body = await req.json()
  const { booking_id } = body

  if (!booking_id) {
    return NextResponse.json({ error: 'booking_id is required' }, { status: 400 })
  }

  // Fetch booking
  const { data: booking, error: bookingErr } = await supabase
    .from('bookings')
    .select('id, booking_ref, total_amount, payment_status')
    .eq('id', booking_id)
    .single()

  if (bookingErr || !booking) {
    return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
  }
  if (booking.payment_status === 'paid') {
    return NextResponse.json({ error: 'Booking is already paid' }, { status: 409 })
  }

  try {
    const { keyId, keySecret } = getRazorpayConfig()
    const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret })

    const order = await razorpay.orders.create({
      amount:   Math.round(booking.total_amount * 100), // paise
      currency: 'INR',
      receipt:  booking.booking_ref,
      notes:    { booking_id },
    })

    // Store order in payments table
    await supabase.from('payments').insert({
      booking_id,
      amount:              booking.total_amount,
      currency:            'INR',
      payment_method:      'razorpay',
      razorpay_order_id:   order.id,
      status:              'pending',
    })

    return NextResponse.json({
      order_id:   order.id,
      amount:     order.amount,
      currency:   order.currency,
      key_id:     keyId,
      booking_ref: booking.booking_ref,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? 'Failed to create order' }, { status: 500 })
  }
}
