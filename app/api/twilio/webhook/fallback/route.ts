import { type NextRequest, NextResponse } from "next/server"
import twilio from "twilio"

const VoiceResponse = twilio.twiml.VoiceResponse

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const callSid = formData.get("CallSid") as string
    const from = formData.get("From") as string

    console.log("Fallback webhook triggered:", { callSid, from })

    const twiml = new VoiceResponse()
    
    // Friendly fallback message
    twiml.say({
      voice: "alice",
      language: "en-US",
    }, "Thank you for your call. We're currently experiencing high volume, but your call is important to us.")
    
    twiml.pause({ length: 1 })
    
    twiml.say("Please try calling back in a few minutes, or visit our website for immediate assistance.")
    
    // Optional: Collect caller's number for callback
    // twiml.say("If you'd like us to call you back, please press 1 now.")
    // const gather = twiml.gather({
    //   numDigits: 1,
    //   timeout: 5,
    //   action: '/api/twilio/webhook/callback-request'
    // })
    
    twiml.say("Thank you and have a great day!")
    twiml.hangup()

    return new NextResponse(twiml.toString(), {
      headers: { "Content-Type": "text/xml" },
    })

  } catch (error) {
    console.error("Fallback webhook error:", error)

    const twiml = new VoiceResponse()
    twiml.say("Thank you for calling. Goodbye.")
    twiml.hangup()

    return new NextResponse(twiml.toString(), {
      headers: { "Content-Type": "text/xml" },
    })
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: "Twilio Fallback Webhook is running",
    timestamp: new Date().toISOString()
  })
}
