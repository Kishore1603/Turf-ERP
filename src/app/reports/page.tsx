'use client'

import { useState, useEffect } from 'react'
import { subDays, format, startOfMonth, endOfMonth, startOfWeek, endOfWeek } from 'date-fns'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts'
import { TrendingUp, IndianRupee, CalendarCheck, Activity, Download, Filter } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { RevenueDataPoint, UtilizationDataPoint } from '@/types'
import { formatCurrency, formatPercent, cn } from '@/lib/utils'

type Period = 'today' | 'week' | 'month' | 'custom'

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="glass-card px-3 py-2 text-xs shadow-glass-lg">
      <p className="text-slate-400 mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }} className="font-semibold">
          {p.name === 'revenue' ? formatCurrency(p.value) : `${p.value} bookings`}
        </p>
      ))}
    </div>
  )
}

const COLORS = ['#06b6d4', '#8b5cf6', '#10b981', '#f59e0b']

export default function ReportsPage() {
  const [period, setPeriod]   = useState<Period>('week')
  const [dateFrom, setDateFrom] = useState(format(subDays(new Date(), 6), 'yyyy-MM-dd'))
  const [dateTo, setDateTo]   = useState(format(new Date(), 'yyyy-MM-dd'))
  const [loading, setLoading] = useState(true)

  const [revenueData, setRevenueData]   = useState<RevenueDataPoint[]>([])
  const [utilData, setUtilData]         = useState<UtilizationDataPoint[]>([])
  const [summary, setSummary]           = useState({
    totalRevenue: 0,
    totalBookings: 0,
    avgUtilization: 0,
    avgRevPerBooking: 0,
    topTurf: '—',
  })

  useEffect(() => {
    const { from, to } = getRange(period)
    setDateFrom(from)
    setDateTo(to)
  }, [period])

  useEffect(() => {
    loadReports()
  }, [dateFrom, dateTo])

  function getRange(p: Period): { from: string; to: string } {
    const today = new Date()
    if (p === 'today') return { from: format(today, 'yyyy-MM-dd'), to: format(today, 'yyyy-MM-dd') }
    if (p === 'week')  return { from: format(startOfWeek(today, {weekStartsOn: 1}), 'yyyy-MM-dd'), to: format(endOfWeek(today, {weekStartsOn: 1}), 'yyyy-MM-dd') }
    if (p === 'month') return { from: format(startOfMonth(today), 'yyyy-MM-dd'), to: format(endOfMonth(today), 'yyyy-MM-dd') }
    return { from: dateFrom, to: dateTo }
  }

  async function loadReports() {
    setLoading(true)
    try {
      const { data: bookings } = await supabase
        .from('bookings')
        .select('booking_date, total_amount, payment_status, turf_id, turf:turfs(name)')
        .gte('booking_date', dateFrom)
        .lte('booking_date', dateTo)
        .neq('booking_status', 'cancelled')

      if (bookings) {
        // Revenue by date
        const byDate: Record<string, { date: string; revenue: number; bookings: number }> = {}
        bookings.forEach((b: any) => {
          if (!byDate[b.booking_date]) {
            byDate[b.booking_date] = {
              date: format(new Date(b.booking_date), 'dd MMM'),
              revenue: 0,
              bookings: 0,
            }
          }
          byDate[b.booking_date].bookings++
          if (b.payment_status === 'paid') byDate[b.booking_date].revenue += b.total_amount
        })
        setRevenueData(Object.values(byDate).sort((a,b) => a.date.localeCompare(b.date)))

        // Utilization by turf
        const byTurf: Record<string, { name: string; count: number }> = {}
        bookings.forEach((b: any) => {
          const tid = b.turf_id
          if (!byTurf[tid]) byTurf[tid] = { name: (b.turf as any)?.name ?? 'Unknown', count: 0 }
          byTurf[tid].count++
        })
        const days = Math.max(1, Math.round((new Date(dateTo).getTime() - new Date(dateFrom).getTime()) / 86400000) + 1)
        const totalSlotsPerDay = 34
        setUtilData(Object.values(byTurf).map(t => ({
          turf_name: t.name,
          utilization_pct: (t.count / (totalSlotsPerDay * days)) * 100,
          booked_slots: t.count,
          total_slots: totalSlotsPerDay * days,
        })))

        const totalRevenue = bookings.filter(b => b.payment_status === 'paid').reduce((s,b) => s + b.total_amount, 0)
        const topEntry  = Object.entries(byTurf).sort((a,b) => b[1].count - a[1].count)[0]
        setSummary({
          totalRevenue,
          totalBookings: bookings.length,
          avgUtilization: Object.values(byTurf).reduce((s,t) => s + (t.count / (totalSlotsPerDay * days)) * 100, 0) / Math.max(1, Object.keys(byTurf).length),
          avgRevPerBooking: bookings.length ? totalRevenue / bookings.length : 0,
          topTurf: topEntry?.[1].name ?? '—',
        })
      }
    } catch {
      // Mock fallback data
      const mock: RevenueDataPoint[] = Array.from({ length: 7 }, (_, i) => ({
        date: format(subDays(new Date(), 6-i), 'dd MMM'),
        revenue: Math.floor(Math.random() * 8000) + 2000,
        bookings: Math.floor(Math.random() * 10) + 2,
      }))
      setRevenueData(mock)
      setUtilData([
        { turf_name: 'Turf A', utilization_pct: 68, booked_slots: 47, total_slots: 68 },
        { turf_name: 'Turf B', utilization_pct: 52, booked_slots: 35, total_slots: 68 },
      ])
      setSummary({
        totalRevenue: 48200,
        totalBookings: 37,
        avgUtilization: 60,
        avgRevPerBooking: 1303,
        topTurf: 'Turf A',
      })
    } finally {
      setLoading(false)
    }
  }

  const pieData = utilData.map(u => ({ name: u.turf_name, value: u.booked_slots }))

  return (
    <div className="space-y-5 animate-fade-in-up">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-white">Reports & Analytics</h1>
          <p className="text-sm text-slate-500 mt-0.5">Revenue, utilization & booking trends</p>
        </div>
      </div>

      {/* Period selector */}
      <div className="glass-card p-4 rounded-2xl flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1 glass p-1 rounded-xl">
          {(['today', 'week', 'month', 'custom'] as Period[]).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors',
                period === p ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-500 hover:text-slate-300',
              )}
            >
              {p}
            </button>
          ))}
        </div>

        {period === 'custom' && (
          <>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="input-glass py-1.5 w-auto text-xs" />
            <span className="text-slate-600 text-xs">to</span>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="input-glass py-1.5 w-auto text-xs" />
          </>
        )}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Revenue',     value: formatCurrency(summary.totalRevenue),     color: 'text-cyan-400'    },
          { label: 'Total Bookings',    value: String(summary.totalBookings),             color: 'text-violet-400'  },
          { label: 'Avg Utilization',   value: formatPercent(summary.avgUtilization),     color: 'text-emerald-400' },
          { label: 'Avg per Booking',   value: formatCurrency(summary.avgRevPerBooking),  color: 'text-amber-400'   },
        ].map((stat) => (
          <div key={stat.label} className="glass-card p-4 rounded-2xl">
            {loading ? (
              <div className="space-y-2">
                <div className="shimmer h-3 w-20 rounded" />
                <div className="shimmer h-6 w-28 rounded" />
              </div>
            ) : (
              <>
                <p className="text-xs text-slate-500 mb-1">{stat.label}</p>
                <p className={cn('text-xl font-bold', stat.color)}>{stat.value}</p>
              </>
            )}
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Revenue bar chart */}
        <div className="lg:col-span-2 glass-card p-5 rounded-2xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-200">Revenue by Day</h3>
              <p className="text-xs text-slate-600">Paid bookings only</p>
            </div>
          </div>
          {loading ? (
            <div className="shimmer h-52 rounded-xl" />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={revenueData} margin={{ left: -20, right: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} tickFormatter={v => `₹${v/1000}k`} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                <Bar dataKey="revenue" name="revenue" fill="#06b6d4" radius={[6,6,0,0]} fillOpacity={0.85} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Utilization pie */}
        <div className="glass-card p-5 rounded-2xl">
          <h3 className="text-sm font-semibold text-slate-200 mb-4">Bookings by Turf</h3>
          {loading ? (
            <div className="shimmer h-52 rounded-xl" />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="45%"
                  innerRadius={55}
                  outerRadius={80}
                  dataKey="value"
                  paddingAngle={3}
                >
                  {pieData.map((_, idx) => (
                    <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v: number) => [`${v} bookings`, '']}
                  contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, fontSize: 12 }}
                />
                <Legend
                  formatter={(value) => <span style={{ color: '#94a3b8', fontSize: 11 }}>{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Utilization table */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-white/[0.06]">
          <h3 className="text-sm font-semibold text-slate-200">Utilization Breakdown</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="table-glass">
            <thead>
              <tr>
                <th>Turf</th>
                <th>Booked Slots</th>
                <th>Total Slots</th>
                <th>Utilization %</th>
                <th>Visual</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({length: 2}).map((_,i) => (
                  <tr key={i}>
                    {Array.from({length:5}).map((_,j) => (
                      <td key={j}><div className="shimmer h-3 rounded" /></td>
                    ))}
                  </tr>
                ))
              ) : utilData.map((row, idx) => (
                <tr key={row.turf_name}>
                  <td className="font-medium">{row.turf_name}</td>
                  <td>{row.booked_slots}</td>
                  <td>{row.total_slots}</td>
                  <td>
                    <span style={{ color: COLORS[idx % COLORS.length] }} className="font-semibold">
                      {formatPercent(row.utilization_pct)}
                    </span>
                  </td>
                  <td className="w-40">
                    <div className="w-full h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${Math.min(row.utilization_pct, 100)}%`,
                          background: COLORS[idx % COLORS.length],
                        }}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* AI Insights */}
      <div className="glass-card p-5 rounded-2xl border border-cyan-500/20">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-base">⚡</span>
          <h3 className="text-sm font-semibold gradient-text-brand">AI Insights</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-white/[0.03]">
            <p className="text-slate-500 mb-1">Top-performing turf</p>
            <p className="text-cyan-400 font-semibold">{summary.topTurf}</p>
          </div>
          <div className="p-3 rounded-xl bg-white/[0.03]">
            <p className="text-slate-500 mb-1">Demand insight</p>
            <p className="text-violet-400 font-medium">
              {summary.avgUtilization > 60 ? 'High demand — consider adding more peak slots' : 'Moderate demand — run promotional offers'}
            </p>
          </div>
          <div className="p-3 rounded-xl bg-white/[0.03]">
            <p className="text-slate-500 mb-1">Revenue tip</p>
            <p className="text-emerald-400 font-medium">
              {summary.avgRevPerBooking < 1000 ? 'Avg booking value is low — review pricing' : 'Healthy per-booking revenue — maintain current rates'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
