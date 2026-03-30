'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, Search, Filter, Download, Phone, Calendar, IndianRupee, X, RefreshCw } from 'lucide-react'
import { BookingModal } from '@/components/booking/BookingModal'
import { supabase } from '@/lib/supabase'
import type { Booking, Turf, PricingRule, CreateBookingForm, BookingFilters } from '@/types'
import {
  formatCurrency, formatDate, formatTime, formatRelativeDate,
  getStatusStyle, calculateBookingAmount, calculateGST,
  generateBookingRef, timeToMinutes, cn,
} from '@/lib/utils'
import { useSearchParams } from 'next/navigation'

const STATUS_OPTS = ['', 'confirmed', 'completed', 'cancelled'] as const
const PAYMENT_OPTS = ['', 'paid', 'pending', 'failed', 'refunded'] as const

export default function BookingsPage() {
  const searchParams = useSearchParams()
  const [bookings, setBookings]       = useState<Booking[]>([])
  const [turfs, setTurfs]             = useState<Turf[]>([])
  const [pricingRules, setPricingRules] = useState<PricingRule[]>([])
  const [loading, setLoading]         = useState(true)
  const [total, setTotal]             = useState(0)

  const [filters, setFilters]         = useState<BookingFilters>({
    search: '',
    turf_id: '',
    booking_status: undefined,
    payment_status: undefined,
    booking_date: '',
  })

  const [modalOpen, setModalOpen]     = useState(searchParams.get('new') === '1')
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [detailOpen, setDetailOpen]   = useState(false)

  useEffect(() => { loadMeta() }, [])
  useEffect(() => { loadBookings() }, [filters])

  async function loadMeta() {
    const [{ data: t }, { data: r }] = await Promise.all([
      supabase.from('turfs').select('*').eq('is_active', true),
      supabase.from('pricing_rules').select('*').eq('is_active', true),
    ])
    const mockTurfs: Turf[] = [
      { id: 'turf-1', name: 'Turf A', is_active: true, open_time: '06:00', close_time: '23:00', created_at: '', updated_at: '' },
      { id: 'turf-2', name: 'Turf B', is_active: true, open_time: '06:00', close_time: '23:00', created_at: '', updated_at: '' },
    ]
    setTurfs((t ?? []).length > 0 ? (t as Turf[]) : mockTurfs)
    setPricingRules((r ?? []) as PricingRule[])
  }

  async function loadBookings() {
    setLoading(true)
    try {
      let q = supabase
        .from('bookings')
        .select('*, turf:turfs(id,name), customer:customers(id,name,phone)', { count: 'exact' })
        .order('booking_date', { ascending: false })
        .order('start_time', { ascending: false })
        .limit(50)

      if (filters.turf_id) q = q.eq('turf_id', filters.turf_id)
      if (filters.booking_status) q = q.eq('booking_status', filters.booking_status)
      if (filters.payment_status) q = q.eq('payment_status', filters.payment_status)
      if (filters.booking_date)   q = q.eq('booking_date', filters.booking_date)

      const { data, count, error } = await q
      if (!error) {
        let rows = (data ?? []) as Booking[]
        if (filters.search) {
          const s = filters.search.toLowerCase()
          rows = rows.filter(b =>
            b.customer?.name?.toLowerCase().includes(s) ||
            b.customer?.phone?.includes(s) ||
            b.booking_ref?.toLowerCase().includes(s) ||
            b.turf?.name?.toLowerCase().includes(s)
          )
        }
        setBookings(rows)
        setTotal(count ?? rows.length)
      }
    } catch {
      setBookings([])
    } finally {
      setLoading(false)
    }
  }

  async function handleCreateBooking(data: CreateBookingForm) {
    // Upsert customer
    let customerId: string
    const { data: existing } = await supabase.from('customers').select('id').eq('phone', data.customer_phone).single()
    if (existing) {
      customerId = existing.id
    } else {
      const { data: nc, error } = await supabase.from('customers').insert({
        name: data.customer_name, phone: data.customer_phone, email: data.customer_email || null,
      }).select('id').single()
      if (error) throw new Error(error.message)
      customerId = nc.id
    }

    const dayOfWeek = new Date(data.booking_date).getDay()
    const midMin = (timeToMinutes(data.start_time) + timeToMinutes(data.end_time)) / 2
    const rule = pricingRules
      .filter(r => r.turf_id === data.turf_id && r.is_active && r.days_of_week.includes(dayOfWeek)
        && timeToMinutes(r.start_time) <= midMin && timeToMinutes(r.end_time) >= midMin)
      .sort((a,b) => (+b.is_peak) - (+a.is_peak))[0]

    const subtotal = calculateBookingAmount(data.start_time, data.end_time, rule?.price_per_hour ?? 0)
    const gstAmt   = calculateGST(subtotal)
    const durationMin = timeToMinutes(data.end_time) - timeToMinutes(data.start_time)

    const { error } = await supabase.from('bookings').insert({
      booking_ref: generateBookingRef(), turf_id: data.turf_id, customer_id: customerId,
      booking_date: data.booking_date, start_time: data.start_time, end_time: data.end_time,
      duration_minutes: durationMin, total_amount: subtotal + gstAmt, gst_amount: gstAmt,
      payment_method: data.payment_method, payment_status: 'pending', booking_status: 'confirmed',
      sport_type: data.sport_type || null, notes: data.notes || null, is_walk_in: data.is_walk_in,
    })
    if (error) throw new Error(error.message)
    await loadBookings()
  }

  async function handleCancel(booking: Booking) {
    if (!confirm('Cancel this booking? A 50% refund will be processed if paid.')) return
    const refund = booking.payment_status === 'paid' ? booking.total_amount * 0.5 : 0
    await supabase.from('bookings').update({
      booking_status: 'cancelled', cancelled_at: new Date().toISOString(),
      cancellation_reason: 'Admin cancelled', refund_amount: refund,
    }).eq('id', booking.id)
    await loadBookings()
  }

  async function handleMarkPaid(booking: Booking) {
    await supabase.from('bookings').update({ payment_status: 'paid' }).eq('id', booking.id)
    await loadBookings()
  }

  function setFilter(key: keyof BookingFilters, value: string) {
    setFilters(f => ({ ...f, [key]: value || undefined }))
  }

  return (
    <div className="space-y-5 animate-fade-in-up">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Bookings</h1>
          <p className="text-sm text-slate-500 mt-0.5">{total} total records</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={loadBookings} className="btn-secondary py-2 px-3">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button onClick={() => setModalOpen(true)} className="btn-primary">
            <Plus className="w-4 h-4" />
            New Booking
          </button>
        </div>
      </div>

      {/* Filters bar */}
      <div className="glass-card p-4 rounded-2xl">
        <div className="flex flex-wrap gap-3 items-center">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-600" />
            <input
              placeholder="Search name, phone, ref…"
              value={filters.search}
              onChange={e => setFilter('search', e.target.value)}
              className="input-glass pl-9 py-2"
            />
          </div>

          {/* Turf filter */}
          <select
            value={filters.turf_id ?? ''}
            onChange={e => setFilter('turf_id', e.target.value)}
            className="input-glass py-2 w-auto min-w-[120px]"
          >
            <option value="">All Turfs</option>
            {turfs.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>

          {/* Status filter */}
          <select
            value={filters.booking_status ?? ''}
            onChange={e => setFilter('booking_status', e.target.value)}
            className="input-glass py-2 w-auto min-w-[130px]"
          >
            <option value="">All Statuses</option>
            {STATUS_OPTS.slice(1).map(s => <option key={s} value={s}>{s}</option>)}
          </select>

          {/* Payment filter */}
          <select
            value={filters.payment_status ?? ''}
            onChange={e => setFilter('payment_status', e.target.value)}
            className="input-glass py-2 w-auto min-w-[130px]"
          >
            <option value="">All Payments</option>
            {PAYMENT_OPTS.slice(1).map(s => <option key={s} value={s}>{s}</option>)}
          </select>

          {/* Date filter */}
          <input
            type="date"
            value={filters.booking_date ?? ''}
            onChange={e => setFilter('booking_date', e.target.value)}
            className="input-glass py-2 w-auto"
          />

          {/* Clear */}
          {(filters.search || filters.turf_id || filters.booking_status || filters.payment_status || filters.booking_date) && (
            <button
              onClick={() => setFilters({ search: '' })}
              className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1"
            >
              <X className="w-3 h-3" /> Clear
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table-glass">
            <thead>
              <tr>
                <th>Booking Ref</th>
                <th>Customer</th>
                <th>Turf</th>
                <th>Date / Time</th>
                <th>Amount</th>
                <th>Payment</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 8 }).map((_, j) => (
                      <td key={j}><div className="shimmer h-3 rounded w-full" /></td>
                    ))}
                  </tr>
                ))
              ) : bookings.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center text-slate-600 py-12 text-sm">
                    No bookings found
                  </td>
                </tr>
              ) : bookings.map((b) => {
                const ps = getStatusStyle(b.payment_status)
                const bs = getStatusStyle(b.booking_status)
                return (
                  <tr key={b.id}>
                    <td>
                      <span className="text-xs font-mono text-cyan-400">{b.booking_ref}</span>
                      {b.is_walk_in && (
                        <span className="ml-1.5 text-[10px] text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded">Walk-in</span>
                      )}
                    </td>
                    <td>
                      <p className="text-sm font-medium">{b.customer?.name}</p>
                      <p className="text-xs text-slate-500 flex items-center gap-1">
                        <Phone className="w-2.5 h-2.5" />{b.customer?.phone}
                      </p>
                    </td>
                    <td className="text-sm">{b.turf?.name}</td>
                    <td>
                      <p className="text-sm">{formatRelativeDate(b.booking_date)}</p>
                      <p className="text-xs text-slate-500">{formatTime(b.start_time)} – {formatTime(b.end_time)}</p>
                    </td>
                    <td>
                      <p className="text-sm font-semibold">{formatCurrency(b.total_amount)}</p>
                      <p className="text-xs text-slate-600">incl. GST</p>
                    </td>
                    <td>
                      <span className={cn('badge', ps.bg, ps.text)}>{b.payment_status}</span>
                    </td>
                    <td>
                      <span className={cn('badge', bs.bg, bs.text)}>{b.booking_status}</span>
                    </td>
                    <td>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => { setSelectedBooking(b); setDetailOpen(true) }}
                          className="text-xs text-slate-400 hover:text-cyan-400 px-2 py-1 rounded-lg hover:bg-cyan-400/10 transition-colors"
                        >
                          View
                        </button>
                        {b.payment_status === 'pending' && b.booking_status !== 'cancelled' && (
                          <button
                            onClick={() => handleMarkPaid(b)}
                            className="text-xs text-emerald-400 hover:text-emerald-300 px-2 py-1 rounded-lg hover:bg-emerald-400/10 transition-colors"
                          >
                            Mark Paid
                          </button>
                        )}
                        {b.booking_status === 'confirmed' && (
                          <button
                            onClick={() => handleCancel(b)}
                            className="text-xs text-red-400 hover:text-red-300 px-2 py-1 rounded-lg hover:bg-red-400/10 transition-colors"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Booking Modal */}
      <BookingModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleCreateBooking}
        turfs={turfs}
        pricingRules={pricingRules}
      />

      {/* Detail Modal */}
      {detailOpen && selectedBooking && (
        <div className="modal-overlay" onClick={() => setDetailOpen(false)}>
          <div className="modal-box max-w-md" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-white/[0.08] flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white">Booking Details</h3>
                <p className="text-xs text-cyan-400 font-mono">{selectedBooking.booking_ref}</p>
              </div>
              <button onClick={() => setDetailOpen(false)} className="p-1.5 rounded-lg hover:bg-white/[0.08] text-slate-500">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-3">
              {([
                ['Customer',    selectedBooking.customer?.name],
                ['Phone',       selectedBooking.customer?.phone],
                ['Turf',        selectedBooking.turf?.name],
                ['Date',        formatDate(selectedBooking.booking_date)],
                ['Time',        `${formatTime(selectedBooking.start_time)} – ${formatTime(selectedBooking.end_time)}`],
                ['Duration',    `${selectedBooking.duration_minutes} mins`],
                ['Amount',      formatCurrency(selectedBooking.total_amount)],
                ['GST',         formatCurrency(selectedBooking.gst_amount)],
                ['Payment',     selectedBooking.payment_method],
                ['Pay Status',  selectedBooking.payment_status],
                ['Bkg Status',  selectedBooking.booking_status],
                ['Sport',       selectedBooking.sport_type ?? '—'],
                ['Notes',       selectedBooking.notes ?? '—'],
                ['Walk-in',     selectedBooking.is_walk_in ? 'Yes' : 'No'],
              ] as [string, string | undefined][]).map(([label, val]) => (
                <div key={label} className="flex justify-between items-center">
                  <span className="text-xs text-slate-500 w-24 flex-shrink-0">{label}</span>
                  <span className="text-sm text-slate-200 font-medium text-right">{val ?? '—'}</span>
                </div>
              ))}
            </div>
            <div className="px-6 pb-5 flex gap-2">
              {selectedBooking.payment_status === 'pending' && selectedBooking.booking_status !== 'cancelled' && (
                <button
                  onClick={() => { handleMarkPaid(selectedBooking); setDetailOpen(false) }}
                  className="btn-primary flex-1 justify-center py-2 text-xs"
                >
                  Mark Paid
                </button>
              )}
              <button onClick={() => setDetailOpen(false)} className="btn-secondary flex-1 justify-center py-2 text-xs">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
