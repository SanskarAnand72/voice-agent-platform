import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateApiKey, hashApiKey } from '@/lib/api-auth'

/**
 * GET /api/api-keys
 * List all API keys for the authenticated user (hashes only, no plain text).
 */
export async function GET() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: keys, error } = await supabase
    .from('api_keys')
    .select('id, name, key_prefix, scopes, is_active, last_used_at, expires_at, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ keys })
}

/**
 * POST /api/api-keys
 * Generate a new API key. Returns the plain-text key ONCE.
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { name, scopes, expires_at } = body

    if (!name?.trim()) {
      return NextResponse.json({ error: 'name is required' }, { status: 400 })
    }

    // Check key limit (max 10 per user)
    const { count } = await supabase
      .from('api_keys')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_active', true)

    if ((count ?? 0) >= 10) {
      return NextResponse.json(
        { error: 'Maximum of 10 active API keys reached. Delete an existing key first.' },
        { status: 429 }
      )
    }

    // Generate key
    const plainKey = generateApiKey()
    const keyHash = hashApiKey(plainKey)
    const keyPrefix = plainKey.slice(0, 12) + '...'

    const { data: key, error: insertError } = await supabase
      .from('api_keys')
      .insert({
        user_id: user.id,
        name: name.trim(),
        key_hash: keyHash,
        key_prefix: keyPrefix,
        scopes: scopes || ['calls:read', 'calls:write', 'agents:read', 'agents:write'],
        is_active: true,
        expires_at: expires_at || null,
      })
      .select('id, name, key_prefix, scopes, created_at')
      .single()

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    // Return plain key ONE TIME only
    return NextResponse.json(
      {
        ...key,
        key: plainKey,
        message: 'Save this key now — it will never be shown again.',
      },
      { status: 201 }
    )
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
}

/**
 * DELETE /api/api-keys?id=xxx
 * Revoke (soft-delete) an API key.
 */
export async function DELETE(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')

  if (!id) {
    return NextResponse.json({ error: 'id is required' }, { status: 400 })
  }

  const { error } = await supabase
    .from('api_keys')
    .update({ is_active: false })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
