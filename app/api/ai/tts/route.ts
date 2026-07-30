import { createClient } from "@/lib/supabase/server"
import { ElevenLabsService } from "@/lib/ai/elevenlabs"
import { type NextRequest, NextResponse } from "next/server"

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { text, voice_id } = body

    if (!text || !voice_id) {
      return NextResponse.json({ error: "text and voice_id are required" }, { status: 400 })
    }

    const elevenLabs = new ElevenLabsService()
    const audioBuffer = await elevenLabs.textToSpeech({
      text,
      voice_id,
    })

    return new NextResponse(audioBuffer, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": audioBuffer.byteLength.toString(),
      },
    })
  } catch (error) {
    console.error("TTS API Error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate speech" },
      { status: 500 }
    )
  }
}
