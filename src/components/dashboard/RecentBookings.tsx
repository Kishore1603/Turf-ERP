'use client'

import Link from 'next/link'
import { ArrowRight, Phone } from 'lucide-react'
import type { Booking } from '@/types'
import { formatTime, formatRelativeDate, formatCurrency, getStatusStyle, cn } from '@/lib/utils'

interface Props {
  bookings: Booking[]
  loading?: boolean
}

function SkeletonRow() {
  return (
    <tr>
      {[1,2,3,4,5].map(i => (
        <td key={i} className="px-4 py-3.5">
          <div className="shimmer h-3 rounded w-full" />
        </td>
      ))}
    </tr>
  )
}

export function RecentBookings({ bookings, loading }: Props) {
  return (
    <div className="glass-card rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
        <div>
          <h3 className="text-sm font-semibold text-slate-200">Recent Bookings</h3>
          <p className="text-xs text-slate-600 mt-0.5">Today's activity</p>
        </div>
        <Link
          href="/bookings"
          className="flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
        >
          View all <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="table-glass w-full">
          <thead>
            <tr>
              <th>Customer</th>
              <th>Turf</th>
              <th>Date / Time</th>
              <th>Amount</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
              : bookings.length === 0
              ? (
                <tr>
                  <td colSpan={5} className="text-center text-slate-600 py-10 text-sm">
                    No bookings yet today
                  </td>
                </tr>
              )
              : bookings.map((b) => {
                const ps = getStatusStyle(b.payment_status)
                const bs = getStatusStyle(b.booking_status)
                return (
                  <tr key={b.id}>
                    <td>
                      <div>
                        <p className="text-sm font-medium text-slate-200">{b.customer?.name ?? '—'}</p>
                        <p className="text-xs text-slate-600 flex items-center gap-1 mt-0.5">
                          <Phone className="w-2.5 h-2.5" />
                          {b.customer?.phone ?? '—'}
                        </p>
                      </div>
                    </td>
                    <td>
                      <span className="text-sm text-slate-300">{b.turf?.name ?? '—'}</span>
                      {b.is_walk_in && (
                        <span className="ml-2 text-[10px] text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded">
                          Walk-in
                        </span>
                      )}
                    </td>
                    <td>
                      <p className="text-sm text-slate-300">{formatRelativeDate(b.booking_date)}</p>
                      <p className="text-xs text-slate-600">{formatTime(b.start_time)} – {formatTime(b.end_time)}</p>
                    </td>
                    <td>
                      <p className="text-sm font-semibold text-slate-200">{formatCurrency(b.total_amount)}</p>
                      <span className={cn('badge text-[10px]', ps.bg, ps.text)}>
                        {b.payment_status}
                      </span>
                    </td>
                    <td>
                      <span className={cn('badge', bs.bg, bs.text)}>
                        {b.booking_status}
                      </span>
                    </td>
                  </tr>
                )
              })
            }
          </tbody>
        </table>
      </div>
    </div>
  )
}
