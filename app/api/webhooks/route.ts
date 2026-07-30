import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/webhooks
 */
export async function GET() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: webhooks, error } = await supabase
    .from('webhooks')
    .select('id, name, url, events, is_active, last_triggered_at, failure_count, agent_id, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ webhooks })
}

/**
 * POST /api/webhooks
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const { name, url, events, agent_id, secret } = body

    if (!name?.trim() || !url?.trim() || !events?.length) {
      return NextResponse.json(
        { error: 'name, url, and events are required' },
        { status: 400 }
      )
    }

    // Validate URL format
    try { new URL(url) } catch {
      return NextResponse.json({ error: 'Invalid webhook URL' }, { status: 400 })
    }

    const { data: webhook, error: insertError } = await supabase
      .from('webhooks')
      .insert({
        user_id: user.id,
        name: name.trim(),
        url: url.trim(),
        events,
        agent_id: agent_id || null,
        secret: secret?.trim() || null,
        is_active: true,
      })
      .select()
      .single()

    if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 })
    return NextResponse.json({ webhook }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
}

/**
 * PATCH /api/webhooks?id=xxx
 */
export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const body = await req.json()
  const { name, url, events, is_active, secret } = body

  const { data: webhook, error } = await supabase
    .from('webhooks')
    .update({ name, url, events, is_active, secret })
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ webhook })
}

/**
 * DELETE /api/webhooks?id=xxx
 */
export async function DELETE(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const { error } = await supabase
    .from('webhooks')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
