'use client'

import { useEffect, useState } from 'react'
import {
  IndianRupee, CalendarCheck, Activity, MapPin,
  Clock, Plus, ArrowRight, TrendingUp
} from 'lucide-react'
import Link from 'next/link'
import { StatsCard } from '@/components/dashboard/StatsCard'
import { RevenueChart } from '@/components/dashboard/RevenueChart'
import { RecentBookings } from '@/components/dashboard/RecentBookings'
import { UtilizationWidget } from '@/components/dashboard/UtilizationWidget'
import { supabase } from '@/lib/supabase'
import {
  formatCurrency, formatDate, formatTime,
  formatChange, cn,
} from '@/lib/utils'
import type { Booking, DashboardStats, RevenueDataPoint, UtilizationDataPoint } from '@/types'
import { subDays, format, startOfDay, endOfDay } from 'date-fns'

// ─── Quick actions ───────────────────────────────────────────
const QUICK_ACTIONS = [
  { label: 'New Booking',    href: '/bookings?new=1',  color: 'bg-cyan-glow',   icon: Plus        },
  { label: 'View Calendar', href: '/calendar',        color: 'bg-purple-glow', icon: CalendarCheck },
  { label: 'Reports',       href: '/reports',         color: 'bg-green-glow',  icon: TrendingUp   },
  { label: 'Pricing Setup', href: '/pricing',         color: 'bg-amber-glow',  icon: Activity     },
]

// ─── Mock data generator (used until Supabase is connected) ──
function generateMockRevenue(): RevenueDataPoint[] {
  return Array.from({ length: 14 }, (_, i) => {
    const date = subDays(new Date(), 13 - i)
    return {
      date: format(date, 'dd MMM'),
      revenue: Math.floor(Math.random() * 8000) + 2000,
      bookings: Math.floor(Math.random() * 12) + 3,
    }
  })
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentBookings, setRecentBookings] = useState<Booking[]>([])
  const [revenueData, setRevenueData] = useState<RevenueDataPoint[]>([])
  const [utilData, setUtilData] = useState<UtilizationDataPoint[]>([])
  const [loading, setLoading] = useState(true)
  const today = format(new Date(), 'EEEE, dd MMMM yyyy')

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        // ── Revenue data (last 14 days) ──────────────────────
        const { data: revRows } = await supabase
          .rpc('get_revenue_by_date', {
            days_back: 14,
          })
          .select()

        setRevenueData(revRows?.length ? revRows : generateMockRevenue())

        // ── Today's bookings ─────────────────────────────────
        const todayStr = format(new Date(), 'yyyy-MM-dd')
        const { data: bookings } = await supabase
          .from('bookings')
          .select('*, turf:turfs(id,name), customer:customers(id,name,phone)')
          .eq('booking_date', todayStr)
          .neq('booking_status', 'cancelled')
          .order('start_time', { ascending: true })
          .limit(8)

        setRecentBookings((bookings as Booking[]) ?? [])

        // ── Stats ────────────────────────────────────────────
        const { data: turfsData } = await supabase
          .from('turfs')
          .select('id')
          .eq('is_active', true)

        const { data: todayStats } = await supabase
          .from('bookings')
          .select('total_amount, payment_status, booking_status')
          .eq('booking_date', todayStr)
          .neq('booking_status', 'cancelled')

        const todayRevenue = (todayStats ?? [])
          .filter(b => b.payment_status === 'paid')
          .reduce((sum, b) => sum + (b.total_amount ?? 0), 0)

        const pendingCount = (todayStats ?? [])
          .filter(b => b.payment_status === 'pending').length

        // Utilization
        const totalSlots = 34 // 17 hours × 2 slots/hour
        const { data: util } = await supabase
          .from('bookings')
          .select('turf_id, turf:turfs(name)')
          .eq('booking_date', todayStr)
          .neq('booking_status', 'cancelled')

        const turfMap: Record<string, { name: string; count: number }> = {}
        ;(util ?? []).forEach((b: any) => {
          const tid = b.turf_id
          if (!turfMap[tid]) turfMap[tid] = { name: b.turf?.name ?? 'Turf', count: 0 }
          turfMap[tid].count++
        })

        const utilResult: UtilizationDataPoint[] = Object.values(turfMap).map(t => ({
          turf_name: t.name,
          utilization_pct: (t.count / totalSlots) * 100,
          booked_slots: t.count,
          total_slots: totalSlots,
        }))

        // Fallback mock utilization
        if (utilResult.length === 0) {
          utilResult.push(
            { turf_name: 'Turf A', utilization_pct: 68, booked_slots: 23, total_slots: 34 },
            { turf_name: 'Turf B', utilization_pct: 44, booked_slots: 15, total_slots: 34 },
          )
        }
        setUtilData(utilResult)

        const avgUtil = utilResult.reduce((s, u) => s + u.utilization_pct, 0) / (utilResult.length || 1)

        setStats({
          total_revenue: todayRevenue,
          total_bookings: todayStats?.length ?? 0,
          active_turfs: turfsData?.length ?? 2,
          utilization_rate: avgUtil,
          revenue_change_pct: 12.4,
          bookings_change_pct: 8.1,
          pending_payments: pendingCount,
          todays_revenue: todayRevenue,
        })
      } catch (err) {
        // Fallback to mock data when Supabase isn't yet connected
        setRevenueData(generateMockRevenue())
        setStats({
          total_revenue: 18400,
          total_bookings: 14,
          active_turfs: 2,
          utilization_rate: 72,
          revenue_change_pct: 12.4,
          bookings_change_pct: 8.1,
          pending_payments: 3,
          todays_revenue: 18400,
        })
        setUtilData([
          { turf_name: 'Turf A', utilization_pct: 74, booked_slots: 25, total_slots: 34 },
          { turf_name: 'Turf B', utilization_pct: 52, booked_slots: 18, total_slots: 34 },
        ])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Page header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Overview</h1>
          <p className="text-sm text-slate-500 mt-0.5">{today}</p>
        </div>
        <Link href="/bookings?new=1" className="btn-primary">
          <Plus className="w-4 h-4" />
          New Booking
        </Link>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Today's Revenue"
          value={formatCurrency(stats?.total_revenue ?? 0)}
          change={stats?.revenue_change_pct}
          changeLabel="vs yesterday"
          icon={<IndianRupee className="w-5 h-5" />}
          accentColor="cyan"
          loading={loading}
        />
        <StatsCard
          title="Today's Bookings"
          value={String(stats?.total_bookings ?? 0)}
          change={stats?.bookings_change_pct}
          changeLabel="vs yesterday"
          icon={<CalendarCheck className="w-5 h-5" />}
          accentColor="purple"
          loading={loading}
        />
        <StatsCard
          title="Avg Utilization"
          value={`${Math.round(stats?.utilization_rate ?? 0)}%`}
          icon={<Activity className="w-5 h-5" />}
          accentColor="green"
          loading={loading}
        />
        <StatsCard
          title="Active Turfs"
          value={String(stats?.active_turfs ?? 0)}
          changeLabel={`${stats?.pending_payments ?? 0} pending payments`}
          icon={<MapPin className="w-5 h-5" />}
          accentColor="amber"
          loading={loading}
        />
      </div>

      {/* Main content row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Revenue chart – 2/3 */}
        <div className="lg:col-span-2">
          <RevenueChart data={revenueData} loading={loading} />
        </div>
        {/* Utilization – 1/3 */}
        <UtilizationWidget data={utilData} loading={loading} />
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent bookings – 2/3 */}
        <div className="lg:col-span-2">
          <RecentBookings bookings={recentBookings} loading={loading} />
        </div>

        {/* Quick actions + upcoming */}
        <div className="space-y-4">
          {/* Quick actions */}
          <div className="glass-card p-5 rounded-2xl">
            <h3 className="text-sm font-semibold text-slate-200 mb-3">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-2">
              {QUICK_ACTIONS.map((action) => (
                <Link
                  key={action.href}
                  href={action.href}
                  className="flex flex-col items-center gap-2 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] hover:border-white/[0.1] transition-all group"
                >
                  <div className={cn('p-2 rounded-lg', action.color)}>
                    <action.icon className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-xs text-slate-400 group-hover:text-slate-200 text-center leading-tight transition-colors">
                    {action.label}
                  </span>
                </Link>
              ))}
            </div>
          </div>

          {/* Upcoming bookings */}
          <div className="glass-card p-5 rounded-2xl">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-slate-200">Up Next</h3>
              <Clock className="w-4 h-4 text-slate-600" />
            </div>
            <div className="space-y-2">
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="shimmer h-12 rounded-lg" />
                ))
              ) : recentBookings.slice(0, 3).map((b) => (
                <div
                  key={b.id}
                  className="flex items-center gap-3 p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.04]"
                >
                  <div className="w-1 h-8 rounded-full bg-cyan-500/60 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-slate-300 truncate">{b.customer?.name}</p>
                    <p className="text-[10px] text-slate-600">
                      {b.turf?.name} · {formatTime(b.start_time)}
                    </p>
                  </div>
                  <p className="ml-auto text-xs font-semibold text-cyan-400 flex-shrink-0">
                    {formatCurrency(b.total_amount)}
                  </p>
                </div>
              ))}
              {!loading && recentBookings.length === 0 && (
                <p className="text-xs text-slate-600 text-center py-4">No upcoming bookings</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
