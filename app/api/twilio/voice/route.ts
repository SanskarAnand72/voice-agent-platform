import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"
import twilio from "twilio"

const VoiceResponse = twilio.twiml.VoiceResponse

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  try {
    const formData = await request.formData()
    const callSid = formData.get("CallSid") as string
    const from = formData.get("From") as string
    const to = formData.get("To") as string
    const callStatus = formData.get("CallStatus") as string

    console.log("Twilio Voice Webhook:", {
      callSid,
      from,
      to,
      callStatus,
    })

    // Create TwiML response
    const twiml = new VoiceResponse()

    if (!callSid || !from || !to) {
      twiml.say("Hello! Your call has been received, but there was an error with the connection.")
      twiml.hangup()
      
      return new NextResponse(twiml.toString(), {
        headers: { "Content-Type": "text/xml" },
      })
    }

    // Find agent by phone number
    const { data: agent, error: agentError } = await supabase
      .from("agents")
      .select("*")
      .eq("phone_number", to)
      .eq("is_active", true)
      .single()

    if (agentError || !agent) {
      // Default greeting when no agent is found
      twiml.say({
        voice: "alice",
      }, "Hello! Your call has been received. Thank you for calling our Voice AI service.")
      
      // Optional: Forward to a backup number
      // twiml.dial("+1234567890") // Replace with your backup number
      
      twiml.say("We are currently unavailable. Please try again later.")
      twiml.hangup()

      return new NextResponse(twiml.toString(), {
        headers: { "Content-Type": "text/xml" },
      })
    }

    // Create or update call record
    const { data: existingCall } = await supabase
      .from("calls")
      .select("*")
      .eq("twilio_call_sid", callSid)
      .single()

    if (!existingCall) {
      const { error: callError } = await supabase
        .from("calls")
        .insert({
          user_id: agent.user_id,
          agent_id: agent.id,
          twilio_call_sid: callSid,
          caller_phone: from,
          agent_phone: to,
          direction: "inbound",
          status: callStatus === "ringing" ? "ringing" : "in-progress",
          started_at: new Date().toISOString(),
        })

      if (callError) {
        console.error("Failed to create call record:", callError)
      }
    }

    // AI Agent greeting with personality
    const greeting = agent.system_prompt 
      ? `Hello! You've reached ${agent.name}. ${agent.description || 'I\'m here to help you.'} Please speak after the tone.`
      : `Hello! Your call has been received by ${agent.name}. Please speak after the tone.`

    twiml.say({
      voice: "alice",
      language: "en-US",
    }, greeting)

    // Start speech recognition and conversation
    const gather = twiml.gather({
      input: ["speech"] as any,
      action: `/api/twilio/webhook/speech?agent_id=${agent.id}&call_sid=${callSid}`,
      method: "POST",
      speechTimeout: "auto",
      speechModel: "experimental_conversations",
      enhanced: true,
      partialResultCallback: `/api/twilio/webhook/partial-speech?agent_id=${agent.id}`,
    } as any)

    // Add a pause for the user to speak
    gather.pause({ length: 2 })

    // Fallback if no speech is detected
    twiml.redirect(`/api/twilio/webhook/speech?agent_id=${agent.id}&call_sid=${callSid}&timeout=true`)

    return new NextResponse(twiml.toString(), {
      headers: { 
        "Content-Type": "text/xml",
        "Cache-Control": "no-cache",
      },
    })

  } catch (error) {
    console.error("Voice webhook error:", error)

    const twiml = new VoiceResponse()
    twiml.say({
      voice: "alice",
    }, "Hello! Your call has been received. We're experiencing a temporary issue, but your call is important to us.")
    
    // Optionally redirect to a backup handler
    twiml.redirect("/api/twilio/webhook/fallback")

    return new NextResponse(twiml.toString(), {
      headers: { "Content-Type": "text/xml" },
    })
  }
}

// Handle GET requests for webhook verification
export async function GET(request: NextRequest) {
  return NextResponse.json({ 
    message: "Twilio Voice Webhook is running",
    timestamp: new Date().toISOString(),
    status: "active"
  })
}
