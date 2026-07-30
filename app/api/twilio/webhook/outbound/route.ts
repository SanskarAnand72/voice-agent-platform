import { createClient } from '@/lib/supabase/server'
import { type NextRequest, NextResponse } from 'next/server'
import twilio from 'twilio'

const VoiceResponse = twilio.twiml.VoiceResponse

/**
 * POST /api/twilio/webhook/outbound
 * TwiML handler for outbound calls initiated via /v1/calls or make-call.
 * Greets the callee and starts the AI conversation loop.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const twiml = new VoiceResponse()

  try {
    const { searchParams } = new URL(request.url)
    const agentId = searchParams.get('agent_id')

    const formData = await request.formData()
    const callSid = formData.get('CallSid') as string
    const answeredBy = formData.get('AnsweredBy') as string

    // Detect if answered by machine (answering machine detection)
    if (answeredBy === 'machine_start' || answeredBy === 'fax') {
      twiml.hangup()
      return xmlResponse(twiml)
    }

    if (!agentId) {
      twiml.say('Hello, this is an automated call. Goodbye.')
      twiml.hangup()
      return xmlResponse(twiml)
    }

    const { data: agent } = await supabase
      .from('agents')
      .select('*')
      .eq('id', agentId)
      .single()

    if (!agent) {
      twiml.say('Hello, this is an automated call. Goodbye.')
      twiml.hangup()
      return xmlResponse(twiml)
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3002'

    // Opening greeting for outbound
    const greeting = agent.system_prompt?.includes('Hello')
      ? `This is ${agent.name}. `
      : `Hello! This is ${agent.name} calling. `

    twiml.say({ voice: 'alice', language: agent.language || 'en-US' },
      greeting + 'Thank you for taking my call.')

    // Start gathering speech  
    const gather = twiml.gather({
      input: ['speech'] as any,
      action: `${baseUrl}/api/twilio/webhook/speech?agent_id=${agentId}&call_sid=${callSid}`,
      method: 'POST',
      speechTimeout: 'auto',
      speechModel: 'experimental_conversations',
      enhanced: true,
    } as any)
    gather.pause({ length: 2 })

    twiml.redirect(
      { method: 'POST' },
      `${baseUrl}/api/twilio/webhook/speech?agent_id=${agentId}&call_sid=${callSid}&timeout=true`
    )

    return xmlResponse(twiml)
  } catch (error) {
    console.error('Outbound call webhook error:', error)
    twiml.say('Hello, there was a technical issue. Goodbye.')
    twiml.hangup()
    return xmlResponse(twiml)
  }
}

function xmlResponse(twiml: InstanceType<typeof VoiceResponse>): NextResponse {
  return new NextResponse(twiml.toString(), {
    headers: { 'Content-Type': 'text/xml', 'Cache-Control': 'no-cache' },
  })
}
