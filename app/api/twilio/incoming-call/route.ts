import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    console.log('Incoming call webhook received')

    // Create TwiML response with agent's voice
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="alice" language="en-US">
        Hello! This is your AI assistant. I'm calling to check on you today. How are you doing?
    </Say>
    <Pause length="2"/>
    <Say voice="alice" language="en-US">
        I'm here to help you with any questions or tasks you might have. Please feel free to speak with me.
    </Say>
    <Pause length="3"/>
    <Gather input="speech" timeout="10" speechTimeout="auto" action="https://a0edb58d10fc.ngrok-free.app/api/twilio/process-speech" method="POST">
        <Say voice="alice" language="en-US">
            Please tell me how I can assist you today.
        </Say>
    </Gather>
    <Say voice="alice" language="en-US">
        I didn't hear anything. Thank you for your time. Have a great day!
    </Say>
</Response>`

    return new NextResponse(twiml, {
      status: 200,
      headers: {
        'Content-Type': 'text/xml'
      }
    })

  } catch (error: any) {
    console.error('Incoming call webhook error:', error)
    
    // Return a simple fallback TwiML response
    const fallbackTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="alice" language="en-US">
        Hello! This is a test call from your AI assistant. Thank you for answering. Goodbye!
    </Say>
</Response>`

    return new NextResponse(fallbackTwiml, {
      status: 200,
      headers: {
        'Content-Type': 'text/xml'
      }
    })
  }
}

// Handle GET requests for testing
export async function GET(request: NextRequest) {
  return NextResponse.json({ 
    message: "AI Agent Incoming Call Webhook",
    description: "TwiML response with conversational AI agent",
    endpoint: "/api/twilio/incoming-call",
    timestamp: new Date().toISOString(),
    usage: "Configure this URL as your Twilio voice webhook",
    example_response: "AI assistant speaks and gathers speech input"
  })
}
