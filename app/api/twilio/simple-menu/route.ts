import { type NextRequest, NextResponse } from "next/server"
import twilio from "twilio"

const VoiceResponse = twilio.twiml.VoiceResponse

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const digits = formData.get("Digits") as string
    const callSid = formData.get("CallSid") as string

    console.log("Simple menu selection:", { digits, callSid })

    const twiml = new VoiceResponse()

    switch (digits) {
      case "1":
        // Leave a message
        twiml.say("Please leave your message after the tone. Press any key when finished.")
        twiml.record({
          action: "/api/twilio/recording-complete",
          maxLength: 60,
          finishOnKey: "#",
          transcribe: true,
        } as any)
        break

      case "2":
        // Speak with agent
        twiml.say("Connecting you to an agent. Please hold.")
        // In a real scenario, you would:
        // twiml.dial("+1234567890") // Agent's number
        // For demo purposes:
        twiml.say("All agents are currently busy. Please try again later.")
        break

      default:
        // Invalid selection
        twiml.say("Invalid selection.")
        twiml.redirect("/api/twilio/simple")
        break
    }

    // End call gracefully
    if (digits === "1" || digits === "2") {
      twiml.say("Thank you for calling. Goodbye!")
      twiml.hangup()
    }

    return new NextResponse(twiml.toString(), {
      headers: { "Content-Type": "text/xml" },
    })

  } catch (error) {
    console.error("Simple menu error:", error)

    const twiml = new VoiceResponse()
    twiml.say("Sorry, there was an error processing your selection.")
    twiml.redirect("/api/twilio/simple")

    return new NextResponse(twiml.toString(), {
      headers: { "Content-Type": "text/xml" },
    })
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: "Simple Menu Handler",
    options: {
      "1": "Leave a message",
      "2": "Speak with an agent"
    }
  })
}
