'use client'

import { useState, useEffect } from 'react'
import { Plus, MapPin, Edit2, Trash2, ToggleLeft, ToggleRight, Image, X, CheckCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Turf, CreateTurfForm } from '@/types'
import { cn } from '@/lib/utils'

const AMENITIES_LIST = ['Floodlights', 'Changing Rooms', 'Parking', 'Washrooms', 'Drinking Water', 'First Aid', 'Cafeteria', 'Spectator Stand']
const SPORT_LIST = ['Football', 'Cricket', 'Badminton', 'Tennis', 'Basketball', 'Volleyball']

const DEFAULT_FORM: CreateTurfForm = {
  name: '',
  description: '',
  location: '',
  amenities: [],
  sport_types: [],
  open_time: '06:00',
  close_time: '23:00',
}

export default function TurfsPage() {
  const [turfs, setTurfs]     = useState<Turf[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editTurf, setEditTurf]   = useState<Turf | null>(null)
  const [form, setForm]           = useState<CreateTurfForm>(DEFAULT_FORM)
  const [saving, setSaving]       = useState(false)
  const [error, setError]         = useState('')

  useEffect(() => { loadTurfs() }, [])

  async function loadTurfs() {
    setLoading(true)
    const { data } = await supabase.from('turfs').select('*').order('name')
    if (data?.length) {
      setTurfs(data as Turf[])
    } else {
      // Mock data for demo
      setTurfs([
        {
          id: 'turf-1', name: 'Turf A', description: 'FIFA-standard grass turf with floodlights',
          location: 'Block A, Sports Complex, Mumbai', amenities: ['Floodlights', 'Parking', 'Washrooms'],
          sport_types: ['Football', 'Cricket'], open_time: '06:00', close_time: '23:00',
          is_active: true, created_at: '', updated_at: '',
        },
        {
          id: 'turf-2', name: 'Turf B', description: 'Synthetic turf ideal for multi-sport',
          location: 'Block B, Sports Complex, Mumbai', amenities: ['Floodlights', 'Changing Rooms', 'Cafeteria'],
          sport_types: ['Badminton', 'Tennis', 'Basketball'], open_time: '07:00', close_time: '22:00',
          is_active: true, created_at: '', updated_at: '',
        },
      ])
    }
    setLoading(false)
  }

  function openCreate() {
    setEditTurf(null)
    setForm(DEFAULT_FORM)
    setError('')
    setModalOpen(true)
  }

  function openEdit(turf: Turf) {
    setEditTurf(turf)
    setForm({
      name: turf.name,
      description: turf.description ?? '',
      location: turf.location ?? '',
      amenities: turf.amenities ?? [],
      sport_types: turf.sport_types ?? [],
      open_time: turf.open_time,
      close_time: turf.close_time,
    })
    setError('')
    setModalOpen(true)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) return setError('Turf name is required')
    setSaving(true)
    try {
      if (editTurf) {
        const { error } = await supabase.from('turfs').update({ ...form, updated_at: new Date().toISOString() }).eq('id', editTurf.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('turfs').insert({ ...form, is_active: true })
        if (error) throw error
      }
      setModalOpen(false)
      await loadTurfs()
    } catch (err: any) {
      setError(err.message ?? 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  async function handleToggle(turf: Turf) {
    await supabase.from('turfs').update({ is_active: !turf.is_active }).eq('id', turf.id)
    await loadTurfs()
  }

  async function handleDelete(turf: Turf) {
    if (!confirm(`Delete "${turf.name}"? All associated data will be affected.`)) return
    await supabase.from('turfs').delete().eq('id', turf.id)
    await loadTurfs()
  }

  function toggleAmenity(item: string) {
    setForm(f => ({
      ...f,
      amenities: f.amenities?.includes(item)
        ? f.amenities.filter(a => a !== item)
        : [...(f.amenities ?? []), item],
    }))
  }
  function toggleSport(item: string) {
    setForm(f => ({
      ...f,
      sport_types: f.sport_types?.includes(item)
        ? f.sport_types.filter(s => s !== item)
        : [...(f.sport_types ?? []), item],
    }))
  }

  return (
    <div className="space-y-5 animate-fade-in-up">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Turf Management</h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage your sports facilities</p>
        </div>
        <button onClick={openCreate} className="btn-primary"><Plus className="w-4 h-4" />Add Turf</button>
      </div>

      {/* Turf cards */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {[1, 2].map(i => <div key={i} className="glass-card p-6 rounded-2xl space-y-4"><div className="shimmer h-32 rounded-xl" /><div className="shimmer h-5 w-32 rounded" /></div>)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {turfs.map((turf, idx) => (
            <div key={turf.id} className={cn('glass-card rounded-2xl overflow-hidden transition-all', !turf.is_active ? 'opacity-60' : '')}>
              {/* Turf banner */}
              <div
                className={cn(
                  'h-32 flex items-end p-4 relative',
                  idx === 0
                    ? 'bg-gradient-to-br from-cyan-900/60 to-cyan-500/20'
                    : 'bg-gradient-to-br from-purple-900/60 to-purple-500/20',
                )}
              >
                <div className="absolute inset-0 flex items-center justify-center opacity-10">
                  <MapPin className="w-24 h-24" style={{ color: idx === 0 ? '#06b6d4' : '#8b5cf6' }} />
                </div>
                <div className="relative z-10 flex items-center justify-between w-full">
                  <div>
                    <h2 className="text-lg font-bold text-white">{turf.name}</h2>
                    <p className="text-xs text-white/60">{turf.location}</p>
                  </div>
                  <span className={cn('px-2.5 py-1 rounded-full text-xs font-semibold', turf.is_active ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400')}>
                    {turf.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>

              {/* Turf body */}
              <div className="p-5 space-y-4">
                <p className="text-sm text-slate-400">{turf.description}</p>

                {/* Hours */}
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span>🕐</span>
                  <span>{turf.open_time} – {turf.close_time}</span>
                </div>

                {/* Sports */}
                {turf.sport_types?.length ? (
                  <div className="flex flex-wrap gap-1.5">
                    {turf.sport_types.map(s => (
                      <span key={s} className="text-xs px-2 py-0.5 rounded-md bg-cyan-500/10 text-cyan-400">{s}</span>
                    ))}
                  </div>
                ) : null}

                {/* Amenities */}
                {turf.amenities?.length ? (
                  <div className="flex flex-wrap gap-1.5">
                    {turf.amenities.map(a => (
                      <span key={a} className="text-xs px-2 py-0.5 rounded-md bg-white/[0.05] text-slate-400 flex items-center gap-1">
                        <CheckCircle className="w-2.5 h-2.5 text-emerald-400" />{a}
                      </span>
                    ))}
                  </div>
                ) : null}

                {/* Actions */}
                <div className="flex items-center gap-2 pt-1 border-t border-white/[0.06]">
                  <button onClick={() => openEdit(turf)} className="btn-secondary py-2 px-3 flex-1 justify-center text-xs">
                    <Edit2 className="w-3.5 h-3.5" /> Edit
                  </button>
                  <button onClick={() => handleToggle(turf)} className="btn-secondary py-2 px-3 flex-1 justify-center text-xs">
                    {turf.is_active ? <ToggleRight className="w-3.5 h-3.5 text-cyan-400" /> : <ToggleLeft className="w-3.5 h-3.5" />}
                    {turf.is_active ? 'Disable' : 'Enable'}
                  </button>
                  <button onClick={() => handleDelete(turf)} className="btn-secondary py-2 px-3 text-red-400 hover:bg-red-500/10 text-xs">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Turf form modal */}
      {modalOpen && (
        <div className="modal-overlay" onClick={(e) => { if(e.target === e.currentTarget) setModalOpen(false) }}>
          <div className="modal-box max-w-md">
            <div className="px-6 py-4 border-b border-white/[0.08] flex items-center justify-between">
              <h2 className="text-sm font-semibold text-white">{editTurf ? 'Edit Turf' : 'Add New Turf'}</h2>
              <button onClick={() => setModalOpen(false)} className="text-slate-500 hover:text-slate-300"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleSave} className="px-6 py-5 space-y-4">
              {error && <p className="text-sm text-red-400 bg-red-500/10 px-3 py-2 rounded-xl">{error}</p>}

              <div>
                <label className="text-xs text-slate-500 mb-1 block">Turf Name *</label>
                <input placeholder="e.g. Turf A" value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} className="input-glass" required />
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Description</label>
                <textarea placeholder="Brief description" value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} rows={2} className="input-glass resize-none" />
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Location / Address</label>
                <input placeholder="Full address" value={form.location} onChange={e => setForm(f => ({...f, location: e.target.value}))} className="input-glass" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Opening Time</label>
                  <input type="time" value={form.open_time} onChange={e => setForm(f => ({...f, open_time: e.target.value}))} className="input-glass" />
                </div>
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Closing Time</label>
                  <input type="time" value={form.close_time} onChange={e => setForm(f => ({...f, close_time: e.target.value}))} className="input-glass" />
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-2 block">Sports Supported</label>
                <div className="flex flex-wrap gap-1.5">
                  {SPORT_LIST.map(s => (
                    <button type="button" key={s} onClick={() => toggleSport(s)}
                      className={cn('px-2.5 py-1 rounded-lg text-xs transition-colors',
                        form.sport_types?.includes(s) ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40' : 'bg-white/[0.04] text-slate-500 border border-white/[0.08]'
                      )}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-2 block">Amenities</label>
                <div className="flex flex-wrap gap-1.5">
                  {AMENITIES_LIST.map(a => (
                    <button type="button" key={a} onClick={() => toggleAmenity(a)}
                      className={cn('px-2.5 py-1 rounded-lg text-xs transition-colors',
                        form.amenities?.includes(a) ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-white/[0.04] text-slate-500 border border-white/[0.08]'
                      )}
                    >
                      {a}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center">
                  {saving ? 'Saving…' : editTurf ? 'Update Turf' : 'Create Turf'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
