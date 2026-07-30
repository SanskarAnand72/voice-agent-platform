import { NextRequest, NextResponse } from 'next/server'
import { requireApiKey } from '@/lib/api-auth'
import { createClient } from '@/lib/supabase/server'
import twilio from 'twilio'

export const dynamic = 'force-dynamic'

/**
 * POST /v1/calls
 * Trigger an outbound call using assistant_id.
 * Requires API key authentication.
 * 
 * Body: { assistant_id: string, to_phone: string }
 */
export async function POST(req: NextRequest) {
  // Authenticate API key
  const auth = await requireApiKey(req)
  if (auth instanceof NextResponse) return auth

  try {
    const accountSid = process.env.TWILIO_ACCOUNT_SID
    const authToken = process.env.TWILIO_AUTH_TOKEN
    if (!accountSid || !authToken) {
      return NextResponse.json(
        { error: 'Missing TWILIO_ACCOUNT_SID or TWILIO_AUTH_TOKEN environment variable.' },
        { status: 500 }
      )
    }

    const client = twilio(accountSid, authToken)
    const body = await req.json()
    const { assistant_id, to_phone, to } = body

    const toNumber = to_phone || to

    if (!assistant_id || !toNumber) {
      return NextResponse.json(
        { error: 'assistant_id and to_phone are required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Look up the agent by assistant_id, scoped to this user
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('*')
      .eq('assistant_id', assistant_id)
      .eq('user_id', auth.user.userId)
      .eq('status', 'active')
      .single()

    if (agentError || !agent) {
      return NextResponse.json(
        {
          error: 'Agent not found or not active',
          assistant_id,
        },
        { status: 404 }
      )
    }

    const fromNumber = agent.phone_number || process.env.TWILIO_PHONE_NUMBER
    if (!fromNumber) {
      return NextResponse.json(
        { error: 'Agent has no Twilio phone number configured' },
        { status: 400 }
      )
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3002'
    const webhookUrl = `${baseUrl}/api/twilio/webhook/outbound?agent_id=${agent.id}`

    // Initiate Twilio call
    const call = await client.calls.create({
      to: toNumber,
      from: fromNumber,
      url: webhookUrl,
      method: 'POST',
      record: agent.call_recording ?? true,
      statusCallback: `${baseUrl}/api/twilio/webhook/status`,
      statusCallbackMethod: 'POST',
      statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed'],
    })

    // Save to database
    const { data: callRecord } = await supabase
      .from('calls')
      .insert({
        user_id: auth.user.userId,
        agent_id: agent.id,
        twilio_call_sid: call.sid,
        caller_phone: toNumber,
        agent_phone: fromNumber,
        direction: 'outbound',
        status: 'initiated',
        started_at: new Date().toISOString(),
      })
      .select()
      .single()

    return NextResponse.json(
      {
        id: callRecord?.id,
        call_sid: call.sid,
        status: call.status,
        direction: 'outbound',
        assistant_id,
        to: toNumber,
        from: fromNumber,
        created_at: new Date().toISOString(),
      },
      { status: 201 }
    )
  } catch (error: unknown) {
    console.error('POST /v1/calls error:', error)
    const msg = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

/**
 * GET /v1/calls
 * List calls for the authenticated user.
 */
export async function GET(req: NextRequest) {
  try {
    const auth = await requireApiKey(req)
    if (auth instanceof NextResponse) return auth

    const supabase = await createClient()
    const { searchParams } = new URL(req.url)
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)
    const offset = parseInt(searchParams.get('offset') || '0')

    const { data: calls, error } = await supabase
      .from('calls')
      .select('*')
      .eq('user_id', auth.user.userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      data: calls,
      pagination: { limit, offset, total: calls?.length ?? 0 },
    })
  } catch (error) {
    console.error('GET /v1/calls error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
