import { NextRequest, NextResponse } from 'next/server'
import { requireApiKey } from '@/lib/api-auth'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /v1/agents
 * List agents for the authenticated user.
 */
export async function GET(req: NextRequest) {
  const auth = await requireApiKey(req)
  if (auth instanceof NextResponse) return auth

  const supabase = await createClient()
  const { searchParams } = new URL(req.url)
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)

  const { data: agents, error } = await supabase
    .from('agents')
    .select('id, assistant_id, name, description, model, voice_id, phone_number, status, created_at')
    .eq('user_id', auth.user.userId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data: agents })
}

/**
 * POST /v1/agents
 * Create a new agent via API.
 */
export async function POST(req: NextRequest) {
  const auth = await requireApiKey(req)
  if (auth instanceof NextResponse) return auth

  try {
    const body = await req.json()
    const { name, system_prompt, model, voice_id, phone_number } = body

    if (!name || !system_prompt) {
      return NextResponse.json(
        { error: 'name and system_prompt are required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Get user's workspace
    const { data: membership } = await supabase
      .from('workspace_members')
      .select('workspace_id')
      .eq('user_id', auth.user.userId)
      .single()

    const { data: agent, error } = await supabase
      .from('agents')
      .insert({
        user_id: auth.user.userId,
        workspace_id: membership?.workspace_id,
        name,
        system_prompt,
        model: model || 'gpt-4o',
        voice_id,
        phone_number,
        status: 'active',
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data: agent }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
}

/**
 * DELETE /v1/agents
 * Delete an agent by assistant_id.
 */
export async function DELETE(req: NextRequest) {
  const auth = await requireApiKey(req)
  if (auth instanceof NextResponse) return auth

  const { searchParams } = new URL(req.url)
  const assistantId = searchParams.get('assistant_id')

  if (!assistantId) {
    return NextResponse.json({ error: 'assistant_id query param required' }, { status: 400 })
  }

  const supabase = await createClient()

  const { error } = await supabase
    .from('agents')
    .delete()
    .eq('assistant_id', assistantId)
    .eq('user_id', auth.user.userId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
