import { createClient } from "@/lib/supabase/server"
import { DeepgramService } from "@/lib/ai/deepgram"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const formData = await request.formData()
    const audioFile = formData.get("audio") as File
    const callId = formData.get("call_id") as string

    if (!audioFile || !callId) {
      return NextResponse.json({ error: "audio file and call_id are required" }, { status: 400 })
    }

    const audioBuffer = await audioFile.arrayBuffer()
    const deepgram = new DeepgramService()

    const transcription = await deepgram.transcribeAudio({
      audio: audioBuffer,
      punctuate: true,
      smart_format: true,
    })

    // Log transcription
    await supabase.from("call_logs").insert({
      call_id: callId,
      user_id: user.id,
      type: "user_speech",
      content: transcription.transcript,
      timestamp_ms: Date.now(),
      confidence: transcription.confidence,
    })

    return NextResponse.json({
      transcript: transcription.transcript,
      confidence: transcription.confidence,
      words: transcription.words,
    })
  } catch (error) {
    console.error("STT API Error:", error)
    return NextResponse.json({ error: "Failed to transcribe audio" }, { status: 500 })
  }
}
