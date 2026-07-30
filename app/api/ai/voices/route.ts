import { createClient } from "@/lib/supabase/server"
import { ElevenLabsService } from "@/lib/ai/elevenlabs"
import { NextResponse } from "next/server"

export async function GET() {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const elevenLabs = new ElevenLabsService()
    const voices = await elevenLabs.getVoices()

    return NextResponse.json({ voices })
  } catch (error) {
    console.error("Voices API Error:", error)
    return NextResponse.json({ error: "Failed to fetch voices" }, { status: 500 })
  }
}
