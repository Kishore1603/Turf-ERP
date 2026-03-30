'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Bell, Plus, Search, MapPin, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

const BREADCRUMBS: Record<string, string> = {
  '/':         'Dashboard',
  '/calendar': 'Calendar',
  '/bookings': 'Bookings',
  '/turfs':    'Turfs',
  '/pricing':  'Pricing',
  '/reports':  'Reports',
  '/settings': 'Settings',
}

export function Header() {
  const pathname = usePathname()
  const [notifOpen, setNotifOpen] = useState(false)

  const currentPage = BREADCRUMBS[pathname] ?? 'Page'

  return (
    <header className="h-14 flex items-center px-4 md:px-6 border-b border-white/[0.06] bg-[#070c1a]/90 backdrop-blur-xl z-30 flex-shrink-0 sticky top-0">
      {/* Brand (mobile) */}
      <div className="flex items-center gap-2 md:hidden mr-4">
        <div className="w-7 h-7 rounded-lg bg-cyan-500 flex items-center justify-center">
          <span className="text-white font-bold text-xs">T</span>
        </div>
        <span className="font-semibold text-sm gradient-text-brand">TurfPro</span>
      </div>

      {/* Page title */}
      <h1 className="hidden md:block text-base font-semibold text-slate-100 mr-4">
        {currentPage}
      </h1>

      {/* Search */}
      <div className="flex-1 max-w-sm hidden md:flex items-center">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search bookings, customers…"
            className="w-full pl-9 pr-4 py-2 text-sm bg-white/[0.04] border border-white/[0.08] rounded-xl text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/50 focus:bg-white/[0.06] transition-all"
          />
        </div>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Turf selector */}
      <button className="hidden md:flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-slate-300 hover:bg-white/[0.07] transition-colors mr-3">
        <MapPin className="w-4 h-4 text-emerald-400" />
        <span>All Turfs</span>
        <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
      </button>

      {/* Quick create booking */}
      <Link
        href="/bookings?new=1"
        className="btn-primary mr-3 hidden md:inline-flex py-2 px-4 text-xs"
      >
        <Plus className="w-3.5 h-3.5" />
        New Booking
      </Link>

      {/* Notifications */}
      <div className="relative">
        <button
          onClick={() => setNotifOpen(!notifOpen)}
          className="relative p-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-slate-400 hover:text-slate-200 hover:bg-white/[0.07] transition-colors"
        >
          <Bell className="w-4.5 h-4.5 w-[18px] h-[18px]" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-cyan-400" />
        </button>

        {notifOpen && (
          <div className="absolute right-0 top-11 w-72 glass-card shadow-glass-lg z-50 overflow-hidden">
            <div className="px-4 py-3 border-b border-white/[0.06]">
              <p className="text-sm font-semibold text-slate-200">Notifications</p>
            </div>
            <div className="divide-y divide-white/[0.04]">
              {[
                { msg: 'New booking – Ravi Kumar for Turf A', time: '2 min ago', type: 'booking' },
                { msg: 'Payment received ₹1,200 for BKG-0042', time: '15 min ago', type: 'payment' },
                { msg: 'Turf B is at 90% utilization today', time: '1 hr ago', type: 'alert' },
              ].map((n, i) => (
                <div key={i} className="px-4 py-3 hover:bg-white/[0.03] transition-colors cursor-pointer">
                  <div className="flex items-start gap-3">
                    <span className={cn(
                      'mt-0.5 w-2 h-2 rounded-full flex-shrink-0',
                      n.type === 'booking'  ? 'bg-cyan-400'    : '',
                      n.type === 'payment'  ? 'bg-emerald-400' : '',
                      n.type === 'alert'    ? 'bg-amber-400'   : '',
                    )} />
                    <div>
                      <p className="text-xs text-slate-300 leading-relaxed">{n.msg}</p>
                      <p className="text-[10px] text-slate-600 mt-0.5">{n.time}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="px-4 py-2.5 border-t border-white/[0.06]">
              <button className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors">
                View all notifications
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Admin avatar */}
      <div className="ml-3 w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
        A
      </div>
    </header>
  )
}
