import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"
import twilio from "twilio"

const VoiceResponse = twilio.twiml.VoiceResponse

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  try {
    const formData = await request.formData()
    const recordingUrl = formData.get("RecordingUrl") as string
    const recordingSid = formData.get("RecordingSid") as string
    const callSid = formData.get("CallSid") as string
    const recordingDuration = formData.get("RecordingDuration") as string
    const transcriptionText = formData.get("TranscriptionText") as string

    console.log("Recording completed:", {
      recordingSid,
      callSid,
      duration: recordingDuration,
      hasTranscription: !!transcriptionText,
    })

    // Store recording information in database
    if (recordingUrl && callSid) {
      const { error } = await supabase
        .from("call_logs")
        .insert({
          call_sid: callSid,
          message_type: "recording",
          content: transcriptionText || "Voice message recorded",
          metadata: {
            recording_url: recordingUrl,
            recording_sid: recordingSid,
            duration: parseInt(recordingDuration || "0"),
          },
          timestamp: new Date().toISOString(),
        })

      if (error) {
        console.error("Failed to store recording info:", error)
      }
    }

    const twiml = new VoiceResponse()
    twiml.say("Thank you for your message. We'll get back to you soon.")
    twiml.hangup()

    return new NextResponse(twiml.toString(), {
      headers: { "Content-Type": "text/xml" },
    })

  } catch (error) {
    console.error("Recording completion error:", error)

    const twiml = new VoiceResponse()
    twiml.say("Your message was received. Thank you for calling.")
    twiml.hangup()

    return new NextResponse(twiml.toString(), {
      headers: { "Content-Type": "text/xml" },
    })
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: "Recording Completion Handler",
    description: "Processes completed voice recordings from Twilio"
  })
}
