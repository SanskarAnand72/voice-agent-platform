import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    console.log('Processing speech input...')

    // Parse form data from Twilio
    const formData = await req.formData()
    const speechResult = formData.get('SpeechResult') as string
    const confidence = formData.get('Confidence') as string

    console.log('Speech Result:', speechResult)
    console.log('Confidence:', confidence)

    // Create TwiML response based on speech input
    let twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>`

    if (speechResult && speechResult.trim()) {
      // User said something - respond accordingly
      const userInput = speechResult.toLowerCase().trim()
      
      if (userInput.includes('hello') || userInput.includes('hi')) {
        twiml += `
    <Say voice="alice" language="en-US">
        Hello! It's great to hear from you. How can I help you today?
    </Say>`
      } else if (userInput.includes('good') || userInput.includes('fine') || userInput.includes('well')) {
        twiml += `
    <Say voice="alice" language="en-US">
        That's wonderful to hear! I'm glad you're doing well. Is there anything specific I can assist you with?
    </Say>`
      } else if (userInput.includes('help') || userInput.includes('assistance')) {
        twiml += `
    <Say voice="alice" language="en-US">
        I'm here to help! I can answer questions, provide information, or just have a conversation with you. What would you like to know?
    </Say>`
      } else if (userInput.includes('bye') || userInput.includes('goodbye')) {
        twiml += `
    <Say voice="alice" language="en-US">
        Thank you for talking with me! Have a wonderful day. Goodbye!
    </Say>`
      } else {
        // General response for other inputs
        twiml += `
    <Say voice="alice" language="en-US">
        I heard you say "${speechResult}". That's interesting! Is there anything else you'd like to talk about?
    </Say>
    <Pause length="2"/>
    <Gather input="speech" timeout="8" speechTimeout="auto" action="https://a0edb58d10fc.ngrok-free.app/api/twilio/process-speech" method="POST">
        <Say voice="alice" language="en-US">
            Please continue speaking, or say goodbye when you're ready to end the call.
        </Say>
    </Gather>`
      }
    } else {
      // No speech detected
      twiml += `
    <Say voice="alice" language="en-US">
        I didn't catch that. Could you please speak a bit louder or clearer?
    </Say>
    <Pause length="1"/>
    <Gather input="speech" timeout="8" speechTimeout="auto" action="https://a0edb58d10fc.ngrok-free.app/api/twilio/process-speech" method="POST">
        <Say voice="alice" language="en-US">
            Please try speaking again.
        </Say>
    </Gather>`
    }

    twiml += `
    <Say voice="alice" language="en-US">
        Thank you for calling. Have a great day!
    </Say>
</Response>`

    console.log('Sending TwiML response for speech processing')

    return new NextResponse(twiml, {
      status: 200,
      headers: {
        'Content-Type': 'text/xml'
      }
    })

  } catch (error: any) {
    console.error('Speech processing error:', error)
    
    // Fallback TwiML response
    const fallbackTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="alice" language="en-US">
        I'm sorry, there was a problem processing your speech. Thank you for calling. Goodbye!
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
    message: "Speech Processing Webhook",
    description: "Processes speech input from Twilio calls",
    endpoint: "/api/twilio/process-speech",
    timestamp: new Date().toISOString(),
    usage: "Webhook for Twilio Gather speech processing"
  })
}
