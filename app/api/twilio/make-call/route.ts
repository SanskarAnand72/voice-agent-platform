import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { dispatchWebhook } from '@/lib/webhooks'
import twilio from 'twilio'

export const dynamic = 'force-dynamic'

/**
 * POST /api/twilio/make-call
 * Authenticated dashboard endpoint to make outbound calls.
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

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
    const toNumber = body.to || body.to_phone
    const agentId = body.agent_id

    if (!toNumber) {
      return NextResponse.json({ error: 'to_phone is required' }, { status: 400 })
    }

    let agent = null
    let fromNumber = process.env.TWILIO_PHONE_NUMBER

    // If agent_id provided, fetch agent config
    if (agentId) {
      const { data: agentData } = await supabase
        .from('agents')
        .select('*')
        .eq('id', agentId)
        .eq('user_id', user.id)
        .single()

      if (agentData) {
        agent = agentData
        fromNumber = agentData.phone_number || fromNumber
      }
    }

    if (!fromNumber) {
      return NextResponse.json(
        { error: 'No Twilio phone number configured. Set TWILIO_PHONE_NUMBER or assign a number to the agent.' },
        { status: 400 }
      )
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3002'
    const webhookUrl = agent
      ? `${baseUrl}/api/twilio/webhook/outbound?agent_id=${agent.id}`
      : `${baseUrl}/api/twilio/webhook/incoming`

    console.log(`Initiating outbound call from ${fromNumber} to ${toNumber}`)

    const call = await client.calls.create({
      to: toNumber,
      from: fromNumber,
      url: webhookUrl,
      method: 'POST',
      record: agent?.call_recording !== false,
      statusCallback: `${baseUrl}/api/twilio/webhook/status`,
      statusCallbackMethod: 'POST',
      statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed'],
    })

    // Save call in database
    const { data: callRecord } = await supabase
      .from('calls')
      .insert({
        user_id: user.id,
        agent_id: agentId || null,
        twilio_call_sid: call.sid,
        caller_phone: toNumber,
        agent_phone: fromNumber,
        direction: 'outbound',
        status: 'initiated',
        started_at: new Date().toISOString(),
      })
      .select()
      .single()

    // Dispatch webhook (async)
    if (agent) {
      dispatchWebhook(user.id, 'call_started', {
        call_id: callRecord?.id,
        call_sid: call.sid,
        agent_id: agentId,
        direction: 'outbound',
        caller_phone: toNumber,
      }, agentId).catch(console.error)
    }

    return NextResponse.json({
      success: true,
      call_id: callRecord?.id,
      call_sid: call.sid,
      status: call.status,
      message: `Outbound call initiated to ${toNumber}`,
    })
  } catch (error: unknown) {
    console.error('Make call error:', error)
    const msg = error instanceof Error ? error.message : 'Failed to initiate call'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
