'use client'

import { RadialBarChart, RadialBar, ResponsiveContainer, Cell } from 'recharts'
import type { UtilizationDataPoint } from '@/types'
import { cn } from '@/lib/utils'

interface Props {
  data: UtilizationDataPoint[]
  loading?: boolean
}

const COLORS = ['#06b6d4', '#8b5cf6', '#10b981', '#f59e0b']

export function UtilizationWidget({ data, loading }: Props) {
  if (loading) {
    return (
      <div className="glass-card p-5 rounded-2xl space-y-3">
        <div className="shimmer h-5 w-32 rounded" />
        {[1, 2].map(i => <div key={i} className="shimmer h-8 rounded" />)}
      </div>
    )
  }

  return (
    <div className="glass-card p-5 rounded-2xl h-full">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-slate-200">Turf Utilization</h3>
        <p className="text-xs text-slate-600 mt-0.5">Today's usage</p>
      </div>

      <div className="space-y-3">
        {data.map((item, idx) => (
          <div key={item.turf_name} className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 flex items-center gap-2">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                />
                {item.turf_name}
              </span>
              <span className="font-semibold" style={{ color: COLORS[idx % COLORS.length] }}>
                {Math.round(item.utilization_pct)}%
              </span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${Math.min(item.utilization_pct, 100)}%`,
                  background: `linear-gradient(90deg, ${COLORS[idx % COLORS.length]}cc, ${COLORS[idx % COLORS.length]})`,
                }}
              />
            </div>
            <p className="text-[10px] text-slate-600">
              {item.booked_slots} / {item.total_slots} slots booked
            </p>
          </div>
        ))}
      </div>

      {/* AI Insight */}
      <div className="mt-4 p-3 rounded-xl bg-cyan-500/5 border border-cyan-500/20">
        <p className="text-[11px] text-cyan-300 font-medium mb-0.5">⚡ AI Insight</p>
        <p className="text-[11px] text-slate-400">
          {data[0]?.utilization_pct > 70
            ? `Peak hour detected — consider surge pricing for ${data[0]?.turf_name}`
            : 'Demand is below average. Try off-peak promotions.'}
        </p>
      </div>
    </div>
  )
}
