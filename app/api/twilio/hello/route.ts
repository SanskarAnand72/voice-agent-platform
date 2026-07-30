import { type NextRequest, NextResponse } from "next/server"
import twilio from "twilio"

const VoiceResponse = twilio.twiml.VoiceResponse

export async function POST(request: NextRequest) {
  try {
    // Parse Twilio webhook data
    const formData = await request.formData()
    const callSid = formData.get("CallSid") as string
    const from = formData.get("From") as string
    const to = formData.get("To") as string

    console.log("Hello webhook called:", { callSid, from, to })

    // Create TwiML response - this is your "twinkle" ✨
    const twiml = new VoiceResponse()
    
    // Your original message with better voice options
    twiml.say({ 
      voice: "alice",
      language: "en-US" 
    }, "Hello! Your call has been received successfully.")

    // Optional: Add more interactive elements
    twiml.pause({ length: 1 })
    twiml.say("This is a TwiML response working perfectly!")

    // Return proper TwiML XML response
    return new NextResponse(twiml.toString(), {
      headers: { 
        "Content-Type": "text/xml",
        "Cache-Control": "no-cache",
      },
    })

  } catch (error) {
    console.error("Hello webhook error:", error)

    // Error fallback TwiML
    const twiml = new VoiceResponse()
    twiml.say({ voice: "alice" }, "Sorry, there was an error processing your call.")
    twiml.hangup()

    return new NextResponse(twiml.toString(), {
      headers: { "Content-Type": "text/xml" },
      status: 500,
    })
  }
}

// GET endpoint for testing
export async function GET() {
  const twiml = new VoiceResponse()
  twiml.say({ voice: "alice" }, "Hello! Your call has been received successfully.")

  return new NextResponse(twiml.toString(), {
    headers: { 
      "Content-Type": "text/xml",
      "Cache-Control": "no-cache",
    },
  })
}
