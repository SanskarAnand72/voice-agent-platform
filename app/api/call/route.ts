import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import twilio from 'twilio'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { assistantId, phone } = body
    if (!assistantId || !phone) {
      return NextResponse.json({ error: 'assistantId and phone are required' }, { status: 400 })
    }

    // Find agent by assistantId
    const supabase = await createClient()
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('*')
      .eq('assistant_id', assistantId)
      .single()
    if (agentError || !agent) {
      return NextResponse.json({ error: 'Agent not found for assistantId' }, { status: 404 })
    }

    // Initiate Twilio call
    const accountSid = process.env.TWILIO_ACCOUNT_SID
    const authToken = process.env.TWILIO_AUTH_TOKEN
    if (!accountSid || !authToken) {
      return NextResponse.json(
        { error: 'Missing TWILIO_ACCOUNT_SID or TWILIO_AUTH_TOKEN environment variable.' },
        { status: 500 }
      )
    }

    console.log('=== Making Twilio Call ===')
    console.log('TWILIO_ACCOUNT_SID:', `${accountSid.substring(0, 10)}...`)
    console.log('TWILIO_PHONE_NUMBER:', process.env.TWILIO_PHONE_NUMBER || 'NOT SET')
    console.log('=========================\n')
    
    const client = twilio(accountSid, authToken)
    const call = await client.calls.create({
      url: agent.webhook_url || 'https://a0edb58d10fc.ngrok-free.app/api/twilio/incoming-call',
      to: phone,
      from: agent.phone_number || '+17194097376',
      method: 'POST'
    })

    // Save call to database
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (!authError && user) {
      await supabase.from('calls').insert({
        user_id: user.id,
        agent_id: agent.id,
        twilio_call_sid: call.sid,
        caller_phone: phone,
        direction: 'outbound',
        status: 'initiated',
      })
    }

    return NextResponse.json({
      success: true,
      callSid: call.sid,
      assistantId,
      agentId: agent.id,
      message: `Call initiated to ${phone} using assistantId ${assistantId}`
    })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Server error' }, { status: 500 })
  }
}
