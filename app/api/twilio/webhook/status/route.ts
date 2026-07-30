import { createClient } from '@/lib/supabase/server'
import { dispatchWebhook } from '@/lib/webhooks'
import { clearConversation } from '@/lib/ai/conversation'
import { type NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/twilio/webhook/status
 * Receives Twilio call status callbacks.
 * Updates the call record, aggregates transcripts, and dispatches user webhooks.
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const callSid = formData.get('CallSid') as string
    const callStatus = formData.get('CallStatus') as string
    const duration = formData.get('CallDuration') as string
    const recordingUrl = formData.get('RecordingUrl') as string
    const recordingSid = formData.get('RecordingSid') as string

    if (!callSid) {
      return NextResponse.json({ error: 'CallSid required' }, { status: 400 })
    }

    const supabase = await createClient()

    // Map Twilio call status values to our internal status labels
    const statusMap: Record<string, string> = {
      initiated: 'initiated',
      ringing: 'ringing',
      'in-progress': 'in-progress',
      completed: 'completed',
      failed: 'failed',
      busy: 'busy',
      'no-answer': 'no-answer',
      canceled: 'cancelled',
    }

    const mappedStatus = statusMap[callStatus] ?? callStatus

    const updateData: Record<string, unknown> = {
      status: mappedStatus,
      updated_at: new Date().toISOString(),
    }

    if (mappedStatus === 'completed' || mappedStatus === 'failed') {
      updateData.ended_at = new Date().toISOString()
    }
    if (duration) {
      updateData.duration = parseInt(duration, 10)
    }
    if (recordingUrl) {
      updateData.recording_url = recordingUrl + '.mp3'
      updateData.recording_sid = recordingSid
    }

    // Update call record in the database
    const { data: callRecord } = await supabase
      .from('calls')
      .update(updateData)
      .eq('twilio_call_sid', callSid)
      .select('id, user_id, agent_id, direction, caller_phone')
      .single()

    if (!callRecord) {
      console.warn('[status webhook] Call not found for SID:', callSid)
      return NextResponse.json({ received: true })
    }

    // When a call ends, clear Redis conversation memory and aggregate the transcript
    if (mappedStatus === 'completed' || mappedStatus === 'failed' || mappedStatus === 'cancelled') {
      // Clear conversation memory from Redis (or in-memory fallback)
      await clearConversation(callSid)

      // Aggregate all turn logs into a single transcript string
      const { data: logs } = await supabase
        .from('call_logs')
        .select('type, content, timestamp_ms')
        .eq('call_id', callRecord.id)
        .order('timestamp_ms', { ascending: true })

      if (logs && logs.length > 0) {
        const transcript = logs
          .map((l) => `${l.type === 'user_speech' ? 'Caller' : 'Agent'}: ${l.content}`)
          .join('\n')

        await supabase
          .from('calls')
          .update({ transcript })
          .eq('id', callRecord.id)
      }
    }

    // Dispatch webhook event to user-configured endpoints
    const eventMap: Record<string, 'call_started' | 'call_completed' | 'call_failed'> = {
      'in-progress': 'call_started',
      completed: 'call_completed',
      failed: 'call_failed',
    }

    const event = eventMap[mappedStatus]
    if (event && callRecord.user_id) {
      dispatchWebhook(
        callRecord.user_id,
        event,
        {
          call_id: callRecord.id,
          call_sid: callSid,
          agent_id: callRecord.agent_id,
          status: mappedStatus,
          duration: duration ? parseInt(duration, 10) : null,
          recording_url: recordingUrl ? recordingUrl + '.mp3' : null,
          caller_phone: callRecord.caller_phone,
          direction: callRecord.direction,
        },
        callRecord.agent_id
      ).catch(console.error)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('[status webhook] Unhandled error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
