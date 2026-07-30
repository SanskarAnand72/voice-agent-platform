import { createClient } from "@/lib/supabase/server"
import { makeCall } from "@/lib/twilio/client"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { from_number, to_number, test_mode } = body

    if (!from_number || !to_number) {
      return NextResponse.json({ 
        error: "from_number and to_number are required",
        example: {
          from_number: "+1234567890", // Your Twilio purchased number
          to_number: "+917078716503", // Your personal number
          test_mode: true
        }
      }, { status: 400 })
    }

    console.log(`Making test call from ${from_number} to ${to_number}`)

    // Get base URL for webhook
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || `${request.headers.get('x-forwarded-proto') || 'http'}://${request.headers.get('host')}`
    
    // Make the test call
    const call = await makeCall({
      to: to_number,
      from: from_number,
      url: test_mode 
        ? `${baseUrl}/api/twilio/hello` // Simple test message
        : `${baseUrl}/api/twilio/webhook/outbound`, // Full agent webhook
      statusCallback: `${baseUrl}/api/twilio/webhook/status`,
      record: true,
    })

    return NextResponse.json({
      success: true,
      message: "Test call initiated successfully!",
      call_sid: call.sid,
      status: call.status,
      from: from_number,
      to: to_number,
      call_details: {
        sid: call.sid,
        status: call.status,
        direction: call.direction,
        date_created: call.dateCreated,
      }
    })

  } catch (error) {
    console.error("Test call error:", error)
    
    let errorMessage = "Failed to make test call"
    if (error instanceof Error) {
      if (error.message.includes("Twilio credentials")) {
        errorMessage = "Twilio credentials not configured properly"
      } else if (error.message.includes("Unable to create record")) {
        errorMessage = "Invalid phone number format or unverified number"
      } else if (error.message.includes("not a valid phone number")) {
        errorMessage = "Phone number format is invalid. Use international format like +1234567890"
      } else if (error.message.includes("is not a verified phone number")) {
        errorMessage = "The 'from' number must be a verified Twilio phone number"
      } else {
        errorMessage = error.message
      }
    }
    
    return NextResponse.json({ 
      error: errorMessage,
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    message: "Test Call API",
    usage: "POST with body: { from_number: '+1234567890', to_number: '+917078716503', test_mode: true }",
    instructions: [
      "1. Purchase a phone number from Twilio Console",
      "2. Use that number as 'from_number'", 
      "3. Use your personal number as 'to_number'",
      "4. Set test_mode: true for simple test message",
      "5. Set test_mode: false for full AI agent experience"
    ],
    twilio_console: "https://console.twilio.com/us1/develop/phone-numbers/manage/incoming"
  })
}
