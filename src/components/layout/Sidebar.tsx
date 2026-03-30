'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import {
  LayoutDashboard,
  CalendarDays,
  BookOpen,
  MapPin,
  Zap,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Settings,
  Activity,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { href: '/',         icon: LayoutDashboard, label: 'Dashboard',  color: 'text-cyan-400'   },
  { href: '/calendar', icon: CalendarDays,    label: 'Calendar',   color: 'text-purple-400' },
  { href: '/bookings', icon: BookOpen,        label: 'Bookings',   color: 'text-sky-400'    },
  { href: '/turfs',    icon: MapPin,          label: 'Turfs',      color: 'text-emerald-400'},
  { href: '/pricing',  icon: Zap,             label: 'Pricing',    color: 'text-amber-400'  },
  { href: '/reports',  icon: BarChart3,       label: 'Reports',    color: 'text-violet-400' },
]

export function Sidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile toggle button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed bottom-6 left-6 z-50 md:hidden glass rounded-full p-3 shadow-glass"
      >
        <Activity className="w-5 h-5 text-cyan-400" />
      </button>

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 h-full z-50 flex flex-col transition-all duration-300 ease-in-out',
          'border-r border-white/[0.06]',
          'bg-[#070c1a]',
          // Desktop
          collapsed ? 'w-[72px]' : 'w-[240px]',
          'hidden md:flex',
          // Mobile
          mobileOpen ? '!flex w-[240px]' : '',
        )}
        style={{ top: '56px' }}
      >
        {/* Logo area */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-white/[0.06]">
          {!collapsed && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-cyan-glow flex items-center justify-center">
                <span className="text-white font-bold text-sm">T</span>
              </div>
              <div>
                <p className="text-sm font-semibold gradient-text-brand">TurfPro</p>
                <p className="text-[10px] text-slate-500">ERP System</p>
              </div>
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="ml-auto p-1.5 rounded-lg hover:bg-white/[0.05] text-slate-500 hover:text-slate-300 transition-colors"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 group relative',
                  isActive
                    ? 'bg-white/[0.08] text-white'
                    : 'text-slate-400 hover:bg-white/[0.05] hover:text-slate-200',
                )}
                title={collapsed ? item.label : undefined}
              >
                {/* Active indicator */}
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-cyan-400 rounded-r-full" />
                )}
                <item.icon
                  className={cn('w-5 h-5 flex-shrink-0 transition-colors', isActive ? item.color : '')}
                />
                {!collapsed && (
                  <span className="text-sm font-medium truncate">{item.label}</span>
                )}
                {isActive && !collapsed && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-cyan-400" />
                )}
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="px-2 py-3 border-t border-white/[0.06]">
          <Link
            href="/settings"
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150',
              'text-slate-500 hover:bg-white/[0.05] hover:text-slate-300',
            )}
          >
            <Settings className="w-5 h-5 flex-shrink-0" />
            {!collapsed && <span className="text-sm font-medium">Settings</span>}
          </Link>
          {!collapsed && (
            <div className="mt-3 px-3 py-2 rounded-xl bg-white/[0.03]">
              <p className="text-[11px] text-slate-500">Version 1.0.0 • MVP</p>
              <p className="text-[11px] text-slate-600">© 2026 TurfPro ERP</p>
            </div>
          )}
        </div>
      </aside>

      {/* Spacer for desktop layout */}
      <div
        className={cn(
          'hidden md:block flex-shrink-0 transition-all duration-300',
          collapsed ? 'w-[72px]' : 'w-[240px]',
        )}
        style={{ marginTop: '56px' }}
      />
    </>
  )
}
