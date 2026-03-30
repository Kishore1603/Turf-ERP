import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'

// GET /api/pricing?turf_id=
export async function GET(req: NextRequest) {
  const supabase = createAdminClient()
  const { searchParams } = new URL(req.url)
  const turf_id = searchParams.get('turf_id')

  let query = supabase
    .from('pricing_rules')
    .select('*, turf:turfs(name)')
    .order('start_time')

  if (turf_id) query = query.eq('turf_id', turf_id)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

// POST /api/pricing
export async function POST(req: NextRequest) {
  const supabase = createAdminClient()
  const body = await req.json()

  const { turf_id, name, start_time, end_time, days_of_week, price_per_hour, is_peak } = body

  if (!turf_id || !name || !start_time || !end_time || !days_of_week || price_per_hour == null) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }
  if (price_per_hour < 0) {
    return NextResponse.json({ error: 'Price cannot be negative' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('pricing_rules')
    .insert({ turf_id, name, start_time, end_time, days_of_week, price_per_hour, is_peak: is_peak ?? false, is_active: true })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data }, { status: 201 })
}

// PATCH /api/pricing
export async function PATCH(req: NextRequest) {
  const supabase = createAdminClient()
  const body = await req.json()
  const { id, ...updates } = body

  if (!id) return NextResponse.json({ error: 'Rule ID required' }, { status: 400 })

  const { data, error } = await supabase
    .from('pricing_rules')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

// DELETE /api/pricing?id=
export async function DELETE(req: NextRequest) {
  const supabase = createAdminClient()
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')

  if (!id) return NextResponse.json({ error: 'Rule ID required' }, { status: 400 })

  const { error } = await supabase.from('pricing_rules').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ message: 'Deleted successfully' })
}
