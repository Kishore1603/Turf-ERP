'use client'

import { useState, useEffect } from 'react'
import { X, User, Phone, Mail, MapPin, Clock, CreditCard, Calendar, IndianRupee, ChevronDown, AlertCircle } from 'lucide-react'
import type { Turf, PricingRule, CreateBookingForm } from '@/types'
import {
  formatCurrency, formatTime, calculateBookingAmount,
  calculateGST, calculateTotal, generateTimeSlots,
  timeToMinutes, cn,
} from '@/lib/utils'

interface Props {
  open: boolean
  onClose: () => void
  onSubmit: (data: CreateBookingForm) => Promise<void>
  turfs: Turf[]
  pricingRules: PricingRule[]
  initialDate?: string
  initialTime?: string
  initialTurfId?: string
}

const SPORT_TYPES = ['Football', 'Cricket', 'Badminton', 'Tennis', 'Basketball', 'Volleyball', 'Other']
const TIME_SLOTS = generateTimeSlots(6, 23, 30)

function findApplicablePrice(
  rules: PricingRule[],
  turfId: string,
  date: string,
  startTime: string,
  endTime: string,
): { rule: PricingRule | null; pricePerHour: number } {
  if (!date || !startTime || !endTime) return { rule: null, pricePerHour: 0 }
  const dayOfWeek = new Date(date).getDay()
  const startMin = timeToMinutes(startTime)
  const endMin = timeToMinutes(endTime)
  const midMin = (startMin + endMin) / 2

  const applicable = rules
    .filter(r =>
      r.turf_id === turfId &&
      r.is_active &&
      r.days_of_week.includes(dayOfWeek) &&
      timeToMinutes(r.start_time) <= midMin &&
      timeToMinutes(r.end_time) >= midMin
    )
    .sort((a, b) => (b.is_peak ? 1 : 0) - (a.is_peak ? 1 : 0))

  const rule = applicable[0] ?? null
  return { rule, pricePerHour: rule?.price_per_hour ?? 0 }
}

export function BookingModal({ open, onClose, onSubmit, turfs, pricingRules, initialDate, initialTime, initialTurfId }: Props) {
  const [form, setForm] = useState<CreateBookingForm>({
    turf_id: initialTurfId ?? turfs[0]?.id ?? '',
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    booking_date: initialDate ?? new Date().toISOString().split('T')[0],
    start_time: initialTime ?? '09:00',
    end_time: '10:00',
    payment_method: 'venue',
    sport_type: '',
    notes: '',
    is_walk_in: true,
  })

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [conflictWarning, setConflictWarning] = useState(false)

  useEffect(() => {
    if (initialDate) setForm(f => ({ ...f, booking_date: initialDate }))
    if (initialTime) {
      const [h, m] = initialTime.split(':').map(Number)
      const endH = h + 1
      const endTime = `${String(endH).padStart(2,'0')}:${String(m).padStart(2,'0')}`
      setForm(f => ({ ...f, start_time: initialTime, end_time: endTime }))
    }
    if (initialTurfId) setForm(f => ({ ...f, turf_id: initialTurfId }))
  }, [initialDate, initialTime, initialTurfId, open])

  const { rule: priceRule, pricePerHour } = findApplicablePrice(
    pricingRules, form.turf_id, form.booking_date, form.start_time, form.end_time
  )

  const subtotal = calculateBookingAmount(form.start_time, form.end_time, pricePerHour)
  const gstAmt = calculateGST(subtotal)
  const total = subtotal + gstAmt

  const gstRate = Number(process.env.NEXT_PUBLIC_GST_RATE ?? 18)

  const endTimesAvailable = TIME_SLOTS.filter(t => timeToMinutes(t) > timeToMinutes(form.start_time))

  function set(field: keyof CreateBookingForm, value: string | boolean) {
    setForm(f => ({ ...f, [field]: value }))
    setError('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!form.customer_name.trim()) return setError('Customer name is required')
    if (!form.customer_phone.trim()) return setError('Phone number is required')
    if (!/^[\d\s+()-]{8,}$/.test(form.customer_phone)) return setError('Enter a valid phone number')
    if (!form.turf_id) return setError('Select a turf')
    if (!form.booking_date) return setError('Select a date')
    if (timeToMinutes(form.end_time) <= timeToMinutes(form.start_time)) return setError('End time must be after start time')
    if (total === 0 && priceRule === null) {
      // No pricing rule – warn but allow
    }

    setSubmitting(true)
    try {
      await onSubmit({ ...form })
      onClose()
    } catch (err: any) {
      setError(err?.message ?? 'Failed to create booking. Try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (!open) return null

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal-box w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08]">
          <div>
            <h2 className="text-base font-semibold text-white">New Booking</h2>
            <p className="text-xs text-slate-500 mt-0.5">Create booking on behalf of customer</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/[0.08] text-slate-500 hover:text-slate-300 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2.5">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Customer info */}
          <div className="space-y-1">
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Customer</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-600" />
                <input
                  placeholder="Full Name *"
                  value={form.customer_name}
                  onChange={e => set('customer_name', e.target.value)}
                  className="input-glass pl-9"
                  required
                />
              </div>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-600" />
                <input
                  placeholder="Phone *"
                  value={form.customer_phone}
                  onChange={e => set('customer_phone', e.target.value)}
                  className="input-glass pl-9"
                  required
                />
              </div>
            </div>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-600" />
              <input
                placeholder="Email (optional)"
                type="email"
                value={form.customer_email}
                onChange={e => set('customer_email', e.target.value)}
                className="input-glass pl-9"
              />
            </div>
          </div>

          {/* Turf + Sport */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Turf *</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-600" />
                <select
                  value={form.turf_id}
                  onChange={e => set('turf_id', e.target.value)}
                  className="input-glass pl-9 appearance-none"
                  required
                >
                  {turfs.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Sport</label>
              <select
                value={form.sport_type}
                onChange={e => set('sport_type', e.target.value)}
                className="input-glass appearance-none"
              >
                <option value="">Select sport</option>
                {SPORT_TYPES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          {/* Date + Times */}
          <div className="space-y-2">
            <label className="text-xs text-slate-500 block">Date & Time *</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-600" />
              <input
                type="date"
                value={form.booking_date}
                min={new Date().toISOString().split('T')[0]}
                onChange={e => set('booking_date', e.target.value)}
                className="input-glass pl-9"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-600 mb-1 block">Start time</label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-600" />
                  <select
                    value={form.start_time}
                    onChange={e => set('start_time', e.target.value)}
                    className="input-glass pl-9 appearance-none"
                  >
                    {TIME_SLOTS.slice(0, -1).map(t => (
                      <option key={t} value={t}>{formatTime(t)}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-600 mb-1 block">End time</label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-600" />
                  <select
                    value={form.end_time}
                    onChange={e => set('end_time', e.target.value)}
                    className="input-glass pl-9 appearance-none"
                  >
                    {endTimesAvailable.map(t => (
                      <option key={t} value={t}>{formatTime(t)}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Pricing info */}
          {priceRule && (
            <div className="px-3.5 py-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-xs">
              <div className="flex items-center justify-between">
                <span className={cn('text-cyan-300', priceRule.is_peak ? 'font-semibold' : '')}>
                  {priceRule.is_peak ? '🔥 Peak pricing' : '⚡ Regular pricing'} — {priceRule.name}
                </span>
                <span className="text-slate-400">{formatCurrency(priceRule.price_per_hour)}/hr</span>
              </div>
            </div>
          )}

          {/* Payment method */}
          <div>
            <label className="text-xs text-slate-500 mb-2 block">Payment Method *</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: 'venue',  label: 'Pay at Venue', icon: '🏟️' },
                { value: 'online', label: 'Online (Razorpay)', icon: '💳' },
                { value: 'pending',label: 'Mark Pending',  icon: '⏳' },
              ].map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => set('payment_method', opt.value)}
                  className={cn(
                    'flex flex-col items-center gap-1 px-2 py-2.5 rounded-xl border text-xs transition-all',
                    form.payment_method === opt.value
                      ? 'border-cyan-500/60 bg-cyan-500/10 text-cyan-300'
                      : 'border-white/[0.08] bg-white/[0.03] text-slate-500 hover:border-white/[0.15] hover:text-slate-300',
                  )}
                >
                  <span className="text-sm">{opt.icon}</span>
                  <span className="text-center leading-tight">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <textarea
              placeholder="Notes (optional)"
              value={form.notes}
              onChange={e => set('notes', e.target.value)}
              rows={2}
              className="input-glass resize-none"
            />
          </div>

          {/* Price summary */}
          {subtotal > 0 && (
            <div className="px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm space-y-1.5">
              <div className="flex justify-between text-slate-400">
                <span>Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>GST ({gstRate}%)</span>
                <span>{formatCurrency(gstAmt)}</span>
              </div>
              <div className="flex justify-between text-white font-semibold pt-1 border-t border-white/[0.06]">
                <span>Total</span>
                <span className="text-cyan-400">{formatCurrency(total)}</span>
              </div>
            </div>
          )}

          {/* Walk-in toggle */}
          <label className="flex items-center gap-3 cursor-pointer">
            <div
              onClick={() => set('is_walk_in', !form.is_walk_in)}
              className={cn(
                'w-10 h-5.5 rounded-full relative transition-colors cursor-pointer',
                form.is_walk_in ? 'bg-cyan-500' : 'bg-white/[0.1]',
              )}
              style={{ height: 22, width: 40 }}
            >
              <div className={cn(
                'absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform',
                form.is_walk_in ? 'translate-x-5' : 'translate-x-0.5',
              )} />
            </div>
            <span className="text-sm text-slate-400">Walk-in booking</span>
          </label>

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary flex-1 justify-center"
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating…
                </span>
              ) : (
                <>
                  <IndianRupee className="w-3.5 h-3.5" />
                  Confirm Booking
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
