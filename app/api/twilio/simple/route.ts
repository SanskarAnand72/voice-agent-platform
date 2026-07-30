import { type NextRequest, NextResponse } from "next/server"
import twilio from "twilio"

const VoiceResponse = twilio.twiml.VoiceResponse

// This endpoint demonstrates the Express-style webhook you provided
// Converted to work with Next.js API routes
export async function POST(request: NextRequest) {
  try {
    // Parse form data (equivalent to body-parser in Express)
    const formData = await request.formData()
    const callSid = formData.get("CallSid") as string
    const from = formData.get("From") as string
    const to = formData.get("To") as string

    console.log("Simple voice webhook called:", { callSid, from, to })

    // Create TwiML response (equivalent to your Express example)
    const twiml = new VoiceResponse()

    // Example: Greet caller and forward to another number
    twiml.say({
      voice: "alice",
      language: "en-US",
    }, "Hello! Your call has been received.")

    // Optional: Forward call to another number
    // twiml.dial("+91XXXXXXXXXX") // Replace with your number
    
    // Alternative actions you can add:
    // twiml.play("https://your-domain.com/hold-music.mp3")
    // twiml.record({ 
    //   action: "/api/twilio/recording",
    //   maxLength: 30,
    //   transcribe: true 
    // })

    // For testing, let's add a simple menu
    const gather = twiml.gather({
      numDigits: 1,
      timeout: 10,
      action: "/api/twilio/simple-menu",
    } as any)

    gather.say("Press 1 to leave a message, or 2 to speak with an agent.")
    
    // Fallback if no input
    twiml.say("Thank you for calling. Goodbye!")
    twiml.hangup()

    // Return TwiML response (equivalent to res.type("text/xml").send())
    return new NextResponse(twiml.toString(), {
      headers: { 
        "Content-Type": "text/xml",
        "Cache-Control": "no-cache",
      },
    })

  } catch (error) {
    console.error("Simple voice webhook error:", error)

    // Error fallback
    const twiml = new VoiceResponse()
    twiml.say("Sorry, there was an error. Please try again later.")
    twiml.hangup()

    return new NextResponse(twiml.toString(), {
      headers: { "Content-Type": "text/xml" },
    })
  }
}

// Handle GET requests for testing
export async function GET() {
  return NextResponse.json({ 
    message: "Simple Twilio Voice Webhook (Express-style)",
    timestamp: new Date().toISOString(),
    usage: "POST form-data with Twilio webhook parameters",
    example_twiml: `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">Hello! Your call has been received.</Say>
  <Gather numDigits="1" timeout="10" action="/api/twilio/simple-menu">
    <Say>Press 1 to leave a message, or 2 to speak with an agent.</Say>
  </Gather>
  <Say>Thank you for calling. Goodbye!</Say>
  <Hangup/>
</Response>`
  })
}
