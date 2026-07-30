import { NextRequest, NextResponse } from 'next/server'
import twilio from 'twilio'

const accountSid = process.env.TWILIO_ACCOUNT_SID
const authToken = process.env.TWILIO_AUTH_TOKEN
const client = twilio(accountSid, authToken)

export async function POST(request: NextRequest) {
  try {
    const { fromNumber, toNumber } = await request.json()

    if (!fromNumber || !toNumber) {
      return NextResponse.json(
        { error: 'Both fromNumber and toNumber are required' },
        { status: 400 }
      )
    }

    console.log(`Making simple call from ${fromNumber} to ${toNumber}`)

    // Make call with TwiML URL instead of localhost webhook
    const call = await client.calls.create({
      from: fromNumber,
      to: toNumber,
      // Use Twilio's demo TwiML instead of localhost
      url: 'http://demo.twilio.com/docs/voice.xml', // This works immediately
      // Alternative: Use a simple TwiML response
      // twiml: '<Response><Say>Hello! This is a test call from your AI agent. The integration is working perfectly!</Say></Response>'
    })

    console.log('Call created successfully:', call.sid)

    return NextResponse.json({ 
      success: true, 
      callSid: call.sid,
      message: 'Call initiated successfully! Check your phone.'
    })

  } catch (error: any) {
    console.error('Simple call error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to make call',
        details: error?.message || 'Unknown error',
        code: error?.code || 'UNKNOWN'
      },
      { status: 500 }
    )
  }
}
