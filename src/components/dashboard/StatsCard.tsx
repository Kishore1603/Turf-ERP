'use client'

import { cn } from '@/lib/utils'
import { TrendingUp, TrendingDown } from 'lucide-react'

interface StatsCardProps {
  title: string
  value: string
  change?: number
  changeLabel?: string
  icon: React.ReactNode
  accentColor: 'cyan' | 'purple' | 'green' | 'amber' | 'red'
  loading?: boolean
}

const ACCENT = {
  cyan:   { glow: 'glow-cyan',   bg: 'from-cyan-500/20 to-transparent',   icon: 'bg-cyan-500/20 text-cyan-400',   text: 'text-cyan-400'   },
  purple: { glow: 'glow-purple', bg: 'from-violet-500/20 to-transparent', icon: 'bg-violet-500/20 text-violet-400', text: 'text-violet-400' },
  green:  { glow: 'glow-green',  bg: 'from-emerald-500/20 to-transparent',icon: 'bg-emerald-500/20 text-emerald-400', text: 'text-emerald-400' },
  amber:  { glow: 'glow-amber',  bg: 'from-amber-500/20 to-transparent',  icon: 'bg-amber-500/20 text-amber-400',  text: 'text-amber-400'  },
  red:    { glow: 'glow-red',    bg: 'from-red-500/20 to-transparent',    icon: 'bg-red-500/20 text-red-400',     text: 'text-red-400'    },
}

export function StatsCard({ title, value, change, changeLabel, icon, accentColor, loading }: StatsCardProps) {
  const a = ACCENT[accentColor]

  if (loading) {
    return (
      <div className="glass-card p-5 rounded-2xl space-y-3">
        <div className="shimmer h-4 w-24 rounded" />
        <div className="shimmer h-8 w-32 rounded" />
        <div className="shimmer h-3 w-20 rounded" />
      </div>
    )
  }

  return (
    <div className={cn('glass-card p-5 rounded-2xl relative overflow-hidden group hover:shadow-glass transition-all duration-200', a.glow)}>
      {/* Background gradient accent */}
      <div className={cn('absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l opacity-40 pointer-events-none', a.bg)} />

      <div className="relative z-10">
        {/* Header row */}
        <div className="flex items-start justify-between mb-4">
          <div className={cn('p-2.5 rounded-xl', a.icon)}>
            {icon}
          </div>
          {change !== undefined && (
            <div className={cn('flex items-center gap-1 text-xs font-medium',
              change >= 0 ? 'text-emerald-400' : 'text-red-400'
            )}>
              {change >= 0
                ? <TrendingUp className="w-3.5 h-3.5" />
                : <TrendingDown className="w-3.5 h-3.5" />
              }
              {Math.abs(change).toFixed(1)}%
            </div>
          )}
        </div>

        {/* Value */}
        <div className="space-y-1">
          <p className="text-2xl font-bold text-white tracking-tight">{value}</p>
          <p className="text-sm text-slate-500">{title}</p>
          {changeLabel && (
            <p className="text-xs text-slate-600">{changeLabel}</p>
          )}
        </div>
      </div>
    </div>
  )
}
