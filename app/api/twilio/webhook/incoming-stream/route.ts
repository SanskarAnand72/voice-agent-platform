import { createClient } from '@/lib/supabase/server'
import { dispatchWebhook } from '@/lib/webhooks'
import { type NextRequest, NextResponse } from 'next/server'
import twilio from 'twilio'

const VoiceResponse = twilio.twiml.VoiceResponse

/**
 * POST /api/twilio/webhook/incoming-stream
 * Webhook that routes inbound calls to the new real-time WebSocket Media Stream.
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

    console.log('[incoming-stream] Incoming call:', { callSid, from, to, callStatus })

    if (!callSid || !from || !to) {
      twiml.say({ voice: 'alice' }, "Hello! We're experiencing a connection issue.")
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
      twiml.say({ voice: 'alice' }, "This number is not currently active. Please try again later.")
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
    
    // Convert base HTTP url to WebSocket ws/wss URL
    const wsBaseUrl = baseUrl.replace(/^http/, 'ws')
    const streamUrl = `${wsBaseUrl}/media-stream?agent_id=${agent.id}`

    console.log('[incoming-stream] Connecting call to stream URL:', streamUrl)

    // Optional Greeting message played before connecting stream
    const greeting = `Hello! You've reached ${agent.name}. Please wait while we connect you.`
    twiml.say({ voice: 'alice', language: agent.language || 'en-US' }, greeting)

    // Connect call to real-time WebSockets media stream
    const connect = twiml.connect()
    connect.stream({
      url: streamUrl,
    })

    return xmlResponse(twiml)
  } catch (error) {
    console.error('[incoming-stream] Webhook error:', error)
    twiml.say({ voice: 'alice' }, 'We are experiencing technical difficulties. Please try again later.')
    twiml.hangup()
    return xmlResponse(twiml)
  }
}

function xmlResponse(twiml: InstanceType<typeof VoiceResponse>): NextResponse {
  return new NextResponse(twiml.toString(), {
    headers: {
      'Content-Type': 'text/xml',
      'Cache-Control': 'no-cache',
    },
  })
}
