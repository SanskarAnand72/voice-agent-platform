import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  
  try {
    const formData = await request.formData()
    const callSid = formData.get("CallSid") as string
    const partialSpeech = formData.get("SpeechResult") as string
    const agentId = request.nextUrl.searchParams.get("agent_id")

    if (!callSid || !agentId) {
      return new NextResponse("Missing required parameters", { status: 400 })
    }

    console.log("Partial speech received:", {
      callSid,
      agentId,
      partialSpeech: partialSpeech?.substring(0, 100) + "...",
    })

    // Store partial speech for real-time processing
    if (partialSpeech) {
      const { error } = await supabase
        .from("call_logs")
        .insert({
          call_sid: callSid,
          agent_id: agentId,
          message_type: "partial_speech",
          content: partialSpeech,
          timestamp: new Date().toISOString(),
        })

      if (error) {
        console.error("Failed to store partial speech:", error)
      }
    }

    // Return empty response for partial speech
    return new NextResponse("", { status: 200 })

  } catch (error) {
    console.error("Partial speech webhook error:", error)
    return new NextResponse("Error processing partial speech", { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: "Twilio Partial Speech Webhook is running",
    timestamp: new Date().toISOString()
  })
}
