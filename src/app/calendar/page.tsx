'use client'

import { useState, useEffect } from 'react'
import { Filter, MapPin } from 'lucide-react'
import { BookingCalendar } from '@/components/booking/BookingCalendar'
import { BookingModal } from '@/components/booking/BookingModal'
import { supabase } from '@/lib/supabase'
import type { Booking, Turf, PricingRule, CreateBookingForm } from '@/types'
import {
  calculateBookingAmount, calculateGST,
  generateBookingRef, timeToMinutes,
} from '@/lib/utils'

export default function CalendarPage() {
  const [bookings, setBookings]         = useState<Booking[]>([])
  const [turfs, setTurfs]               = useState<Turf[]>([])
  const [pricingRules, setPricingRules] = useState<PricingRule[]>([])
  const [loading, setLoading]           = useState(true)
  const [selectedTurf, setSelectedTurf] = useState<string>('')

  // Modal state
  const [modalOpen, setModalOpen]       = useState(false)
  const [modalDate, setModalDate]       = useState('')
  const [modalTime, setModalTime]       = useState('')
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [detailOpen, setDetailOpen]     = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    try {
      const [{ data: turfsData }, { data: bookingsData }, { data: rulesData }] =
        await Promise.all([
          supabase.from('turfs').select('*').eq('is_active', true).order('name'),
          supabase.from('bookings')
            .select('*, turf:turfs(id,name), customer:customers(id,name,phone)')
            .neq('booking_status', 'cancelled')
            .gte('booking_date', new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0])
            .lte('booking_date', new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]),
          supabase.from('pricing_rules').select('*').eq('is_active', true),
        ])

      setTurfs((turfsData ?? []) as Turf[])
      setBookings((bookingsData ?? []) as Booking[])
      setPricingRules((rulesData ?? []) as PricingRule[])

      // Mock fallback
      if (!turfsData?.length) {
        setTurfs([
          { id: 'turf-1', name: 'Turf A', is_active: true, open_time: '06:00', close_time: '23:00', created_at: '', updated_at: '' },
          { id: 'turf-2', name: 'Turf B', is_active: true, open_time: '06:00', close_time: '23:00', created_at: '', updated_at: '' },
        ])
      }
    } catch {
      // Mock data
      setTurfs([
        { id: 'turf-1', name: 'Turf A', is_active: true, open_time: '06:00', close_time: '23:00', created_at: '', updated_at: '' },
        { id: 'turf-2', name: 'Turf B', is_active: true, open_time: '06:00', close_time: '23:00', created_at: '', updated_at: '' },
      ])
    } finally {
      setLoading(false)
    }
  }

  function handleSlotClick(date: string, time: string) {
    setModalDate(date)
    setModalTime(time)
    setModalOpen(true)
  }

  function handleBookingClick(booking: Booking) {
    setSelectedBooking(booking)
    setDetailOpen(true)
  }

  async function handleCreateBooking(data: CreateBookingForm) {
    // Find or create customer
    let customerId: string

    const { data: existing } = await supabase
      .from('customers')
      .select('id')
      .eq('phone', data.customer_phone)
      .single()

    if (existing) {
      customerId = existing.id
    } else {
      const { data: newCustomer, error } = await supabase
        .from('customers')
        .insert({
          name: data.customer_name,
          phone: data.customer_phone,
          email: data.customer_email || null,
        })
        .select('id')
        .single()
      if (error) throw new Error(error.message)
      customerId = newCustomer.id
    }

    // Find pricing rule
    const dayOfWeek = new Date(data.booking_date).getDay()
    const midMin = (timeToMinutes(data.start_time) + timeToMinutes(data.end_time)) / 2
    const rule = pricingRules
      .filter(r =>
        r.turf_id === data.turf_id &&
        r.is_active &&
        r.days_of_week.includes(dayOfWeek) &&
        timeToMinutes(r.start_time) <= midMin &&
        timeToMinutes(r.end_time) >= midMin
      )
      .sort((a, b) => (b.is_peak ? 1 : 0) - (a.is_peak ? 1 : 0))[0]

    const pricePerHour = rule?.price_per_hour ?? 0
    const subtotal = calculateBookingAmount(data.start_time, data.end_time, pricePerHour)
    const gstAmt = calculateGST(subtotal)
    const totalAmt = subtotal + gstAmt
    const durationMin = timeToMinutes(data.end_time) - timeToMinutes(data.start_time)

    const { error: bookingError } = await supabase.from('bookings').insert({
      booking_ref: generateBookingRef(),
      turf_id: data.turf_id,
      customer_id: customerId,
      booking_date: data.booking_date,
      start_time: data.start_time,
      end_time: data.end_time,
      duration_minutes: durationMin,
      total_amount: totalAmt,
      gst_amount: gstAmt,
      payment_method: data.payment_method,
      payment_status: data.payment_method === 'venue' ? 'pending' : 'pending',
      booking_status: 'confirmed',
      sport_type: data.sport_type || null,
      notes: data.notes || null,
      is_walk_in: data.is_walk_in,
    })

    if (bookingError) throw new Error(bookingError.message)
    await loadData()
  }

  return (
    <div className="space-y-4 animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Booking Calendar</h1>
          <p className="text-sm text-slate-500 mt-0.5">Click any empty slot to create a booking</p>
        </div>

        <div className="flex items-center gap-2">
          {/* Turf filter */}
          <div className="flex items-center gap-2 glass px-3 py-2 rounded-xl text-sm">
            <MapPin className="w-4 h-4 text-emerald-400" />
            <select
              value={selectedTurf}
              onChange={e => setSelectedTurf(e.target.value)}
              className="bg-transparent text-slate-300 outline-none text-sm"
            >
              <option value="">All Turfs</option>
              {turfs.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Calendar */}
      <BookingCalendar
        bookings={bookings}
        turfs={turfs}
        selectedTurfId={selectedTurf || undefined}
        onSlotClick={handleSlotClick}
        onBookingClick={handleBookingClick}
        loading={loading}
      />

      {/* Create Booking Modal */}
      <BookingModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleCreateBooking}
        turfs={turfs}
        pricingRules={pricingRules}
        initialDate={modalDate}
        initialTime={modalTime}
        initialTurfId={selectedTurf || undefined}
      />

      {/* Booking detail overlay (simplified) */}
      {detailOpen && selectedBooking && (
        <div className="modal-overlay" onClick={() => setDetailOpen(false)}>
          <div className="modal-box max-w-sm" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-white/[0.08]">
              <h3 className="text-sm font-semibold text-white">Booking Details</h3>
              <p className="text-xs text-slate-500">{selectedBooking.booking_ref}</p>
            </div>
            <div className="px-6 py-4 space-y-3 text-sm">
              {[
                ['Customer',  selectedBooking.customer?.name ?? '—'],
                ['Phone',     selectedBooking.customer?.phone ?? '—'],
                ['Turf',      selectedBooking.turf?.name ?? '—'],
                ['Date',      selectedBooking.booking_date],
                ['Time',      `${selectedBooking.start_time} – ${selectedBooking.end_time}`],
                ['Amount',    `₹${selectedBooking.total_amount}`],
                ['Payment',   selectedBooking.payment_status],
                ['Status',    selectedBooking.booking_status],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between">
                  <span className="text-slate-500">{label}</span>
                  <span className="text-slate-200 font-medium">{value}</span>
                </div>
              ))}
            </div>
            <div className="px-6 pb-4 flex gap-2">
              <button onClick={() => setDetailOpen(false)} className="btn-secondary flex-1 justify-center">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
