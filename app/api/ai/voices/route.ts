import { createClient } from "@/lib/supabase/server"
import { ElevenLabsService } from "@/lib/ai/elevenlabs"
import { NextResponse } from "next/server"

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const elevenLabs = new ElevenLabsService()
    const voices = await elevenLabs.getVoices()

    return NextResponse.json({ voices })
  } catch (error) {
    console.error("Voices API Error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch voices" },
      { status: 500 }
    )
  }
}
