'use client'

import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine
} from 'recharts'
import type { RevenueDataPoint } from '@/types'
import { formatCurrency } from '@/lib/utils'

interface Props {
  data: RevenueDataPoint[]
  loading?: boolean
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="glass-card px-3 py-2.5 text-xs shadow-glass-lg min-w-[120px]">
      <p className="text-slate-400 mb-1.5">{label}</p>
      <p className="text-cyan-300 font-semibold">{formatCurrency(payload[0]?.value ?? 0)}</p>
      <p className="text-slate-500">{payload[1]?.value ?? 0} bookings</p>
    </div>
  )
}

export function RevenueChart({ data, loading }: Props) {
  if (loading) {
    return (
      <div className="glass-card p-5 rounded-2xl">
        <div className="shimmer h-5 w-32 rounded mb-4" />
        <div className="shimmer h-48 rounded" />
      </div>
    )
  }

  return (
    <div className="glass-card p-5 rounded-2xl h-full">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-sm font-semibold text-slate-200">Revenue Trend</h3>
          <p className="text-xs text-slate-600 mt-0.5">Last 14 days</p>
        </div>
        <div className="flex items-center gap-4 text-xs text-slate-500">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
            Revenue
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-violet-400" />
            Bookings
          </span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity={0.02} />
            </linearGradient>
            <linearGradient id="bkgGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.25} />
              <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10, fill: '#64748b' }}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fontSize: 10, fill: '#64748b' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.08)', strokeWidth: 1 }} />
          <Area
            type="monotone"
            dataKey="revenue"
            stroke="#06b6d4"
            strokeWidth={2}
            fill="url(#revGrad)"
            dot={false}
            activeDot={{ r: 4, fill: '#06b6d4', strokeWidth: 0 }}
          />
          <Area
            type="monotone"
            dataKey="bookings"
            stroke="#8b5cf6"
            strokeWidth={1.5}
            fill="url(#bkgGrad)"
            dot={false}
            activeDot={{ r: 3, fill: '#8b5cf6', strokeWidth: 0 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
