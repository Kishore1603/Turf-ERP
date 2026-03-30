import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { verifyRazorpaySignature, getRazorpayConfig } from '@/lib/razorpay'

// POST /api/payments/verify
export async function POST(req: NextRequest) {
  const supabase = createAdminClient()
  const body = await req.json()

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, booking_id } = body

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !booking_id) {
    return NextResponse.json({ error: 'Missing required payment fields' }, { status: 400 })
  }

  try {
    const { keySecret } = getRazorpayConfig()
    const isValid = verifyRazorpaySignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      keySecret,
    )

    if (!isValid) {
      // Mark payment as failed
      await supabase.from('payments')
        .update({ status: 'failed', failure_reason: 'Signature mismatch' })
        .eq('razorpay_order_id', razorpay_order_id)

      return NextResponse.json({ error: 'Payment verification failed — invalid signature' }, { status: 400 })
    }

    // Update payment record
    await supabase.from('payments')
      .update({
        razorpay_payment_id,
        razorpay_signature,
        status: 'captured',
      })
      .eq('razorpay_order_id', razorpay_order_id)

    // Update booking payment status
    await supabase.from('bookings')
      .update({ payment_status: 'paid', payment_method: 'online' })
      .eq('id', booking_id)

    return NextResponse.json({ success: true, message: 'Payment verified and booking confirmed' })
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? 'Verification error' }, { status: 500 })
  }
}
