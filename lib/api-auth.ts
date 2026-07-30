import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { createHash } from 'crypto'

/**
 * Hash an API key using SHA-256 for secure storage.
 * We use SHA-256 (not bcrypt) for API keys since we need fast lookup.
 */
export function hashApiKey(key: string): string {
  return createHash('sha256').update(key).digest('hex')
}

/**
 * Generate a new random API key in the format: vapi_sk_xxxxxxxxxxxx
 */
export function generateApiKey(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let random = ''
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  for (const b of bytes) {
    random += chars[b % chars.length]
  }
  return `vapi_sk_${random}`
}

export interface ApiKeyUser {
  userId: string
  keyId: string
  keyName: string
}

/**
 * Authenticate a request using an API key from Authorization header.
 * Supports: "Authorization: Bearer vapi_sk_xxx" or "Authorization: vapi_sk_xxx"
 */
export async function authenticateApiKey(req: NextRequest): Promise<ApiKeyUser | null> {
  const authHeader = req.headers.get('authorization')
  if (!authHeader) return null

  const key = authHeader.replace(/^Bearer\s+/i, '').trim()
  if (!key.startsWith('vapi_sk_')) return null

  const keyHash = hashApiKey(key)
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('api_keys')
    .select('id, user_id, name, is_active, expires_at')
    .eq('key_hash', keyHash)
    .eq('is_active', true)
    .single()

  if (error || !data) return null

  // Check expiry
  if (data.expires_at && new Date(data.expires_at) < new Date()) return null

  // Update last used timestamp (fire and forget)
  supabase
    .from('api_keys')
    .update({ last_used_at: new Date().toISOString() })
    .eq('id', data.id)
    .then(() => {})

  return {
    userId: data.user_id,
    keyId: data.id,
    keyName: data.name,
  }
}

/**
 * Middleware that returns 401 if no valid API key is present.
 */
export async function requireApiKey(req: NextRequest): Promise<{ user: ApiKeyUser } | NextResponse> {
  const user = await authenticateApiKey(req)
  if (!user) {
    return NextResponse.json(
      {
        error: 'Unauthorized',
        message: 'A valid API key is required. Pass it as: Authorization: Bearer vapi_sk_...',
      },
      { status: 401 }
    )
  }
  return { user }
}
