'use client'

import { useState, useEffect } from 'react'
import { Plus, Zap, Edit2, Trash2, ToggleLeft, ToggleRight, Clock, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Turf, PricingRule, CreatePricingRuleForm } from '@/types'
import { formatTime, formatCurrency, DAY_NAMES, cn } from '@/lib/utils'

const DEFAULT_FORM: CreatePricingRuleForm = {
  turf_id: '',
  name: '',
  start_time: '06:00',
  end_time: '09:00',
  days_of_week: [0,1,2,3,4,5,6],
  price_per_hour: 600,
  is_peak: false,
}

export default function PricingPage() {
  const [turfs, setTurfs]             = useState<Turf[]>([])
  const [rules, setRules]             = useState<PricingRule[]>([])
  const [loading, setLoading]         = useState(true)
  const [selectedTurf, setSelectedTurf] = useState<string>('')
  const [modalOpen, setModalOpen]     = useState(false)
  const [editRule, setEditRule]       = useState<PricingRule | null>(null)
  const [form, setForm]               = useState<CreatePricingRuleForm>(DEFAULT_FORM)
  const [saving, setSaving]           = useState(false)
  const [error, setError]             = useState('')

  useEffect(() => { loadData() }, [])

  async function loadData() {
    setLoading(true)
    try {
      const [{ data: t }, { data: r }] = await Promise.all([
        supabase.from('turfs').select('*').eq('is_active', true),
        supabase.from('pricing_rules').select('*, turf:turfs(name)').order('start_time'),
      ])
      const mockTurfs: Turf[] = [
        { id: 'turf-1', name: 'Turf A', is_active: true, open_time: '06:00', close_time: '23:00', created_at: '', updated_at: '' },
        { id: 'turf-2', name: 'Turf B', is_active: true, open_time: '06:00', close_time: '23:00', created_at: '', updated_at: '' },
      ]
      const resolvedTurfs = (t ?? []).length > 0 ? (t as Turf[]) : mockTurfs
      setTurfs(resolvedTurfs)
      setRules((r ?? []) as PricingRule[])
      if (!selectedTurf) setSelectedTurf(resolvedTurfs[0]?.id ?? '')
      setForm(f => ({ ...f, turf_id: resolvedTurfs[0]?.id ?? '' }))
    } finally {
      setLoading(false)
    }
  }

  function openCreate() {
    setEditRule(null)
    setForm({ ...DEFAULT_FORM, turf_id: selectedTurf })
    setError('')
    setModalOpen(true)
  }

  function openEdit(rule: PricingRule) {
    setEditRule(rule)
    setForm({
      turf_id: rule.turf_id,
      name: rule.name,
      start_time: rule.start_time,
      end_time: rule.end_time,
      days_of_week: rule.days_of_week,
      price_per_hour: rule.price_per_hour,
      is_peak: rule.is_peak,
    })
    setError('')
    setModalOpen(true)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) return setError('Rule name is required')
    if (!form.price_per_hour) return setError('Price per hour is required')
    if (form.days_of_week.length === 0) return setError('Select at least one day')

    setSaving(true)
    try {
      if (editRule) {
        const { error } = await supabase.from('pricing_rules').update(form).eq('id', editRule.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('pricing_rules').insert(form)
        if (error) throw error
      }
      setModalOpen(false)
      await loadData()
    } catch (err: any) {
      setError(err.message ?? 'Failed to save rule')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(ruleId: string) {
    if (!confirm('Delete this pricing rule?')) return
    await supabase.from('pricing_rules').delete().eq('id', ruleId)
    await loadData()
  }

  async function handleToggle(rule: PricingRule) {
    await supabase.from('pricing_rules').update({ is_active: !rule.is_active }).eq('id', rule.id)
    await loadData()
  }

  function toggleDay(day: number) {
    setForm(f => ({
      ...f,
      days_of_week: f.days_of_week.includes(day)
        ? f.days_of_week.filter(d => d !== day)
        : [...f.days_of_week, day].sort(),
    }))
  }

  const filteredRules = selectedTurf ? rules.filter(r => r.turf_id === selectedTurf) : rules
  const sortedRules = [...filteredRules].sort((a,b) => a.start_time.localeCompare(b.start_time))

  return (
    <div className="space-y-5 animate-fade-in-up">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Pricing Engine</h1>
          <p className="text-sm text-slate-500 mt-0.5">Configure peak & off-peak pricing rules</p>
        </div>
        <button onClick={openCreate} className="btn-primary"><Plus className="w-4 h-4" />Add Rule</button>
      </div>

      {/* Turf selector tabs */}
      <div className="flex items-center gap-2 glass p-1.5 rounded-xl w-fit">
        {turfs.map(t => (
          <button
            key={t.id}
            onClick={() => setSelectedTurf(t.id)}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium transition-all',
              selectedTurf === t.id ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-400 hover:text-slate-200',
            )}
          >
            {t.name}
          </button>
        ))}
      </div>

      {/* Rules grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="glass-card p-5 rounded-2xl space-y-3">
              {[1,2,3].map(j => <div key={j} className="shimmer h-4 rounded" />)}
            </div>
          ))}
        </div>
      ) : sortedRules.length === 0 ? (
        <div className="glass-card py-16 rounded-2xl text-center">
          <Zap className="w-10 h-10 text-slate-700 mx-auto mb-3" />
          <p className="text-slate-500 text-sm">No pricing rules yet</p>
          <button onClick={openCreate} className="btn-primary mt-4 mx-auto">
            <Plus className="w-4 h-4" /> Add First Rule
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedRules.map((rule) => (
            <div
              key={rule.id}
              className={cn(
                'glass-card p-5 rounded-2xl space-y-3 transition-all',
                !rule.is_active ? 'opacity-50' : '',
                rule.is_peak ? 'border-amber-500/30' : '',
              )}
            >
              {/* Rule header */}
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-white">{rule.name}</h3>
                    {rule.is_peak && (
                      <span className="text-[10px] text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded-full">🔥 Peak</span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-600 mt-0.5">{rule.turf?.name ?? '—'}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <button onClick={() => handleToggle(rule)} className="text-slate-600 hover:text-slate-300">
                    {rule.is_active
                      ? <ToggleRight className="w-5 h-5 text-cyan-400" />
                      : <ToggleLeft className="w-5 h-5" />
                    }
                  </button>
                  <button onClick={() => openEdit(rule)} className="text-slate-600 hover:text-cyan-400 p-1">
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => handleDelete(rule.id)} className="text-slate-600 hover:text-red-400 p-1">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Time range */}
              <div className="flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4 text-slate-600" />
                <span className="text-slate-300">{formatTime(rule.start_time)} – {formatTime(rule.end_time)}</span>
              </div>

              {/* Days */}
              <div className="flex gap-1 flex-wrap">
                {DAY_NAMES.map((day, idx) => (
                  <span
                    key={day}
                    className={cn(
                      'text-[10px] px-2 py-0.5 rounded-md font-medium',
                      rule.days_of_week.includes(idx)
                        ? 'bg-cyan-500/20 text-cyan-400'
                        : 'bg-white/[0.04] text-slate-600',
                    )}
                  >
                    {day}
                  </span>
                ))}
              </div>

              {/* Price */}
              <div className="flex items-center justify-between border-t border-white/[0.06] pt-3">
                <span className="text-xs text-slate-500">Per hour</span>
                <span className={cn('text-lg font-bold', rule.is_peak ? 'text-amber-400' : 'text-cyan-400')}>
                  {formatCurrency(rule.price_per_hour)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Rule form modal */}
      {modalOpen && (
        <div className="modal-overlay" onClick={(e) => { if(e.target === e.currentTarget) setModalOpen(false) }}>
          <div className="modal-box max-w-sm">
            <div className="px-6 py-4 border-b border-white/[0.08] flex items-center justify-between">
              <h2 className="text-sm font-semibold text-white">{editRule ? 'Edit Rule' : 'New Pricing Rule'}</h2>
              <button onClick={() => setModalOpen(false)} className="text-slate-500 hover:text-slate-300">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSave} className="px-6 py-5 space-y-4">
              {error && <p className="text-sm text-red-400 bg-red-500/10 px-3 py-2 rounded-xl">{error}</p>}

              <div>
                <label className="text-xs text-slate-500 mb-1 block">Turf *</label>
                <select value={form.turf_id} onChange={e => setForm(f => ({...f, turf_id: e.target.value}))} className="input-glass">
                  {turfs.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Rule Name *</label>
                <input placeholder="e.g. Weekend Peak" value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} className="input-glass" required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Start Time</label>
                  <input type="time" value={form.start_time} onChange={e => setForm(f => ({...f, start_time: e.target.value}))} className="input-glass" />
                </div>
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">End Time</label>
                  <input type="time" value={form.end_time} onChange={e => setForm(f => ({...f, end_time: e.target.value}))} className="input-glass" />
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-2 block">Days of Week</label>
                <div className="flex gap-1.5 flex-wrap">
                  {DAY_NAMES.map((day, idx) => (
                    <button type="button" key={day} onClick={() => toggleDay(idx)}
                      className={cn('px-2.5 py-1 rounded-lg text-xs font-medium transition-colors',
                        form.days_of_week.includes(idx) ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40' : 'bg-white/[0.04] text-slate-500 border border-white/[0.08] hover:text-slate-300'
                      )}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Price per Hour (₹) *</label>
                <input type="number" min="0" value={form.price_per_hour} onChange={e => setForm(f => ({...f, price_per_hour: Number(e.target.value)}))} className="input-glass" required />
              </div>
              <label className="flex items-center gap-3 cursor-pointer">
                <div onClick={() => setForm(f => ({...f, is_peak: !f.is_peak}))}
                  className={cn('w-10 rounded-full relative transition-colors cursor-pointer', form.is_peak ? 'bg-amber-500' : 'bg-white/[0.1]')}
                  style={{ height: 22, width: 40 }}
                >
                  <div className={cn('absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform', form.is_peak ? 'translate-x-5' : 'translate-x-0.5')} />
                </div>
                <span className="text-sm text-slate-400">Peak pricing rule 🔥</span>
              </label>
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center">
                  {saving ? 'Saving…' : editRule ? 'Update Rule' : 'Create Rule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
