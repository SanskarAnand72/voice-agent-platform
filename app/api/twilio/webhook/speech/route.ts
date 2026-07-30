import { createClient } from '@/lib/supabase/server'
import { generateVoiceResponse } from '@/lib/ai/openai'
import { getConversationHistory, addToConversation } from '@/lib/ai/conversation'
import { dispatchWebhook } from '@/lib/webhooks'
import { type NextRequest, NextResponse } from 'next/server'
import twilio from 'twilio'

const VoiceResponse = twilio.twiml.VoiceResponse

/**
 * POST /api/twilio/webhook/speech
 * Handles Twilio speech gather results.
 * Runs the full AI conversation loop: STT → LLM → TTS response.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient()

  try {
    const { searchParams } = new URL(request.url)
    const agentId = searchParams.get('agent_id')
    const callSidParam = searchParams.get('call_sid') || ''
    const timeout = searchParams.get('timeout') === 'true'

    const formData = await request.formData()
    const speechResult = formData.get('SpeechResult') as string | null
    const confidence = parseFloat((formData.get('Confidence') as string) || '0')
    const twilioCallSid = (formData.get('CallSid') as string) || callSidParam

    const twiml = new VoiceResponse()

    // Handle silence / no speech
    if (timeout || !speechResult?.trim()) {
      twiml.say(
        { voice: 'alice', language: 'en-US' },
        "I didn't catch that. Could you please say that again?"
      )
      const gather = twiml.gather({
        input: ['speech'] as any,
        action: `/api/twilio/webhook/speech?agent_id=${agentId}&call_sid=${twilioCallSid}`,
        method: 'POST',
        speechTimeout: 'auto',
        speechModel: 'experimental_conversations',
        enhanced: true,
      } as any)
      gather.pause({ length: 1 })
      twiml.say({ voice: 'alice' }, 'Thank you for calling. Goodbye!')
      twiml.hangup()
      return xmlResponse(twiml)
    }

    if (!agentId) {
      twiml.say('Sorry, there was a configuration error.')
      twiml.hangup()
      return xmlResponse(twiml)
    }

    // Fetch agent configuration
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('*')
      .eq('id', agentId)
      .single()

    if (agentError || !agent) {
      twiml.say('Sorry, the AI agent could not be found.')
      twiml.hangup()
      return xmlResponse(twiml)
    }

    // Look up the call record
    const { data: callRecord } = await supabase
      .from('calls')
      .select('id, user_id')
      .eq('twilio_call_sid', twilioCallSid)
      .single()

    // Log user speech
    if (callRecord) {
      await supabase.from('call_logs').insert({
        call_id: callRecord.id,
        user_id: callRecord.user_id,
        type: 'user_speech',
        content: speechResult,
        timestamp_ms: Date.now(),
        confidence,
      })
    }

    // ── Conversation memory (Redis-backed) ─────────────────────────────
    // Retrieve the existing multi-turn history for this call
    const history = await getConversationHistory(twilioCallSid)

    // Generate AI response using OpenAI GPT-4o
    const aiResp = await generateVoiceResponse(
      agent.system_prompt,
      speechResult,
      agent.model || 'gpt-4o',
      agent.temperature ?? 0.7,
      history,
    )

    // Persist both turns back to Redis (or memory fallback)
    await addToConversation(twilioCallSid, 'user', speechResult)
    await addToConversation(twilioCallSid, 'assistant', aiResp.text)
    // ──────────────────────────────────────────────────────────────────

    // Log AI response
    if (callRecord) {
      await supabase.from('call_logs').insert({
        call_id: callRecord.id,
        user_id: callRecord.user_id,
        type: 'ai_response',
        content: aiResp.text,
        timestamp_ms: Date.now(),
        metadata: aiResp.usage ? { usage: aiResp.usage } : null,
      })
    }

    // Build TwiML response — prefer ElevenLabs TTS if voice_id is set
    if (agent.voice_id && process.env.ELEVENLABS_API_KEY) {
      try {
        const audioUrl = await synthesizeElevenLabs(aiResp.text, agent.voice_id)
        if (audioUrl) {
          twiml.play(audioUrl)
        } else {
          twiml.say({ voice: 'alice', language: agent.language || 'en-US' }, aiResp.text)
        }
      } catch {
        twiml.say({ voice: 'alice', language: agent.language || 'en-US' }, aiResp.text)
      }
    } else {
      twiml.say({ voice: 'alice', language: agent.language || 'en-US' }, aiResp.text)
    }

    // Continue the conversation loop
    const gather = twiml.gather({
      input: ['speech'] as any,
      action: `/api/twilio/webhook/speech?agent_id=${agentId}&call_sid=${twilioCallSid}`,
      method: 'POST',
      speechTimeout: 'auto',
      speechModel: 'experimental_conversations',
      enhanced: true,
    } as any)
    gather.pause({ length: 1 })

    // Fallback redirect if no speech is detected after bot speaks
    twiml.redirect(
      { method: 'POST' },
      `/api/twilio/webhook/speech?agent_id=${agentId}&call_sid=${twilioCallSid}&timeout=true`
    )

    // Dispatch webhook event (fire-and-forget)
    if (callRecord && agent.user_id) {
      dispatchWebhook(
        agent.user_id,
        'transcript_ready',
        {
          call_id: callRecord.id,
          call_sid: twilioCallSid,
          agent_id: agentId,
          user_message: speechResult,
          ai_response: aiResp.text,
        },
        agentId
      ).catch(console.error)
    }

    return xmlResponse(twiml)
  } catch (error) {
    console.error('[speech webhook] Unhandled error:', error)
    const twiml = new VoiceResponse()
    twiml.say('I apologize, there was a technical issue. Please try again.')
    twiml.hangup()
    return xmlResponse(twiml)
  }
}

/**
 * ElevenLabs TTS placeholder.
 * For production: synthesize audio, upload to Supabase Storage / CDN, return public URL.
 */
async function synthesizeElevenLabs(_text: string, _voiceId: string): Promise<string | null> {
  return null
}

function xmlResponse(twiml: InstanceType<typeof VoiceResponse>): NextResponse {
  return new NextResponse(twiml.toString(), {
    headers: {
      'Content-Type': 'text/xml',
      'Cache-Control': 'no-cache, no-store',
    },
  })
}
