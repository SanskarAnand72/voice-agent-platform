import { createClient } from '@/lib/supabase/server'
import { dispatchWebhook } from '@/lib/webhooks'
import { type NextRequest, NextResponse } from 'next/server'
import twilio from 'twilio'

const VoiceResponse = twilio.twiml.VoiceResponse

/**
 * POST /api/twilio/webhook/incoming
 * Primary Twilio voice webhook for inbound calls.
 * Routes caller to the correct AI agent based on called number.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const twiml = new VoiceResponse()

  try {
    const formData = await request.formData()
    const callSid = formData.get('CallSid') as string
    const from = formData.get('From') as string
    const to = formData.get('To') as string
    const callStatus = formData.get('CallStatus') as string

    console.log('Incoming call:', { callSid, from, to, callStatus })

    if (!callSid || !from || !to) {
      twiml.say({ voice: 'alice' }, "Hello! Thank you for calling. We're experiencing a connection issue.")
      twiml.hangup()
      return xmlResponse(twiml)
    }

    // Find active agent by phone number
    const { data: agent } = await supabase
      .from('agents')
      .select('*')
      .eq('phone_number', to)
      .eq('status', 'active')
      .single()

    if (!agent) {
      twiml.say({ voice: 'alice', language: 'en-US' },
        "Hello! Thank you for calling. This number is not currently active. Please try again later.")
      twiml.hangup()
      return xmlResponse(twiml)
    }

    // Store call in database
    const { data: callRecord } = await supabase
      .from('calls')
      .insert({
        user_id: agent.user_id,
        agent_id: agent.id,
        twilio_call_sid: callSid,
        caller_phone: from,
        agent_phone: to,
        direction: 'inbound',
        status: 'in-progress',
        started_at: new Date().toISOString(),
      })
      .select()
      .single()

    // Fire call_started webhook
    if (agent.user_id) {
      dispatchWebhook(agent.user_id, 'call_started', {
        call_id: callRecord?.id,
        call_sid: callSid,
        agent_id: agent.id,
        assistant_id: agent.assistant_id,
        direction: 'inbound',
        caller_phone: from,
        agent_phone: to,
      }, agent.id).catch(console.error)
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3002'

    // Greeting — use agent's name
    const greeting = `Hello! You've reached ${agent.name}. ${agent.description ? agent.description + '.' : ''} How can I help you today?`

    twiml.say({ voice: 'alice', language: agent.language || 'en-US' }, greeting)

    // Enable recording if configured
    if (agent.call_recording !== false) {
      twiml.record({
        action: `${baseUrl}/api/twilio/webhook/status`,
        method: 'POST',
        maxLength: 3600,
        playBeep: false,
        recordingStatusCallback: `${baseUrl}/api/twilio/webhook/status`,
        recordingStatusCallbackMethod: 'POST',
      })
    }

    // Start conversation loop
    const gather = twiml.gather({
      input: ['speech'] as any,
      action: `${baseUrl}/api/twilio/webhook/speech?agent_id=${agent.id}&call_sid=${callSid}`,
      method: 'POST',
      speechTimeout: 'auto',
      speechModel: 'experimental_conversations',
      enhanced: true,
    } as any)
    gather.pause({ length: 2 })

    // Fallback if no speech
    twiml.redirect(
      { method: 'POST' },
      `${baseUrl}/api/twilio/webhook/speech?agent_id=${agent.id}&call_sid=${callSid}&timeout=true`
    )

    return xmlResponse(twiml)
  } catch (error) {
    console.error('Incoming call webhook error:', error)
    twiml.say({ voice: 'alice' },
      'Hello! We are experiencing technical difficulties. Please try again later.')
    twiml.hangup()
    return xmlResponse(twiml)
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Voice AI Incoming Call Webhook',
    status: 'active',
    timestamp: new Date().toISOString(),
  })
}

function xmlResponse(twiml: InstanceType<typeof VoiceResponse>): NextResponse {
  return new NextResponse(twiml.toString(), {
    headers: {
      'Content-Type': 'text/xml',
      'Cache-Control': 'no-cache',
    },
  })
}
