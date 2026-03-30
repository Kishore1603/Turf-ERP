import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'

// GET /api/turfs
export async function GET(req: NextRequest) {
  const supabase = createAdminClient()
  const { searchParams } = new URL(req.url)
  const active_only = searchParams.get('active') === 'true'

  let query = supabase.from('turfs').select('*').order('name')
  if (active_only) query = query.eq('is_active', true)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

// POST /api/turfs
export async function POST(req: NextRequest) {
  const supabase = createAdminClient()
  const body = await req.json()

  const { name, description, location, amenities, sport_types, open_time, close_time, image_url } = body
  if (!name?.trim()) return NextResponse.json({ error: 'Turf name is required' }, { status: 400 })

  const { data, error } = await supabase
    .from('turfs')
    .insert({ name, description, location, amenities, sport_types, open_time, close_time, image_url, is_active: true })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data }, { status: 201 })
}

// PATCH /api/turfs
export async function PATCH(req: NextRequest) {
  const supabase = createAdminClient()
  const body = await req.json()
  const { id, ...updates } = body

  if (!id) return NextResponse.json({ error: 'Turf ID required' }, { status: 400 })

  const { data, error } = await supabase
    .from('turfs')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

// DELETE /api/turfs?id=
export async function DELETE(req: NextRequest) {
  const supabase = createAdminClient()
  const id = new URL(req.url).searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Turf ID required' }, { status: 400 })

  const { error } = await supabase.from('turfs').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ message: 'Turf deleted' })
}
