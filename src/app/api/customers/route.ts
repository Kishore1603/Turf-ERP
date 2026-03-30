import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'

// GET /api/customers?search=&limit=
export async function GET(req: NextRequest) {
  const supabase = createAdminClient()
  const { searchParams } = new URL(req.url)
  const search = searchParams.get('search') ?? ''
  const limit  = Number(searchParams.get('limit') ?? 30)

  let query = supabase
    .from('customers')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .limit(limit)

  if (search) {
    query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%,email.ilike.%${search}%`)
  }

  const { data, error, count } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data, total: count })
}

// POST /api/customers
export async function POST(req: NextRequest) {
  const supabase = createAdminClient()
  const body = await req.json()
  const { name, phone, email, notes } = body

  if (!name?.trim() || !phone?.trim()) {
    return NextResponse.json({ error: 'Name and phone are required' }, { status: 400 })
  }

  // Check if customer with this phone already exists
  const { data: existing } = await supabase.from('customers').select('id').eq('phone', phone).single()
  if (existing) return NextResponse.json({ error: 'Customer with this phone already exists' }, { status: 409 })

  const { data, error } = await supabase
    .from('customers')
    .insert({ name, phone, email: email ?? null, notes: notes ?? null })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data }, { status: 201 })
}
