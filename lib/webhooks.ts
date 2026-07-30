import { createHash, createHmac } from 'crypto'
import { createClient } from '@/lib/supabase/server'

export type WebhookEvent =
  | 'call_started'
  | 'call_completed'
  | 'call_failed'
  | 'transcript_ready'
  | 'recording_ready'

export interface WebhookPayload {
  event: WebhookEvent
  timestamp: string
  data: Record<string, unknown>
}

/**
 * Dispatch a webhook event to all matching webhooks for a user/agent.
 */
export async function dispatchWebhook(
  userId: string,
  event: WebhookEvent,
  payload: Record<string, unknown>,
  agentId?: string
): Promise<void> {
  try {
    const supabase = await createClient()

    // Find all active webhooks that match this event
    let query = supabase
      .from('webhooks')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .contains('events', [event])

    const { data: webhooks } = await query

    if (!webhooks || webhooks.length === 0) return

    const body: WebhookPayload = {
      event,
      timestamp: new Date().toISOString(),
      data: payload,
    }

    // Fire all webhooks in parallel
    await Promise.allSettled(
      webhooks.map((webhook) => deliverWebhook(webhook, body, supabase))
    )
  } catch (err) {
    console.error('Webhook dispatch error:', err)
  }
}

async function deliverWebhook(
  webhook: { id: string; url: string; secret: string | null; user_id: string },
  payload: WebhookPayload,
  supabase: Awaited<ReturnType<typeof createClient>>
): Promise<void> {
  const start = Date.now()
  const bodyStr = JSON.stringify(payload)

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'User-Agent': 'VoiceAI-Webhooks/1.0',
    'X-VoiceAI-Event': payload.event,
    'X-VoiceAI-Timestamp': payload.timestamp,
  }

  // Add HMAC signature if secret is configured
  if (webhook.secret) {
    const sig = createHmac('sha256', webhook.secret).update(bodyStr).digest('hex')
    headers['X-VoiceAI-Signature'] = `sha256=${sig}`
  }

  let success = false
  let responseStatus: number | undefined
  let responseBody: string | undefined
  const duration = Date.now() - start

  try {
    const response = await fetch(webhook.url, {
      method: 'POST',
      headers,
      body: bodyStr,
      signal: AbortSignal.timeout(10000), // 10 second timeout
    })

    responseStatus = response.status
    responseBody = await response.text().catch(() => '')
    success = response.ok
  } catch (err: unknown) {
    responseBody = err instanceof Error ? err.message : 'Request failed'
  }

  // Record delivery
  await supabase.from('webhook_deliveries').insert({
    webhook_id: webhook.id,
    user_id: webhook.user_id,
    event: payload.event,
    payload,
    response_status: responseStatus,
    response_body: responseBody?.slice(0, 500),
    success,
    duration_ms: Date.now() - start,
  })

  // Update webhook last_triggered_at and failure count
  await supabase
    .from('webhooks')
    .update({
      last_triggered_at: new Date().toISOString(),
      failure_count: success ? 0 : supabase.rpc('increment', { id: webhook.id }),
    })
    .eq('id', webhook.id)
}
