import twilio from "twilio"

let twilioClient: ReturnType<typeof twilio> | null = null

function getTwilioClient() {
  if (!twilioClient) {
    const accountSid = process.env.TWILIO_ACCOUNT_SID
    const authToken = process.env.TWILIO_AUTH_TOKEN

    // Verify environment variables are loaded
    console.log('=== Twilio Client Initialization ===')
    console.log('TWILIO_ACCOUNT_SID:', accountSid ? `${accountSid.substring(0, 10)}...` : 'NOT SET')
    console.log('TWILIO_AUTH_TOKEN:', authToken ? `${authToken.substring(0, 10)}...` : 'NOT SET')
    console.log('TWILIO_PHONE_NUMBER:', process.env.TWILIO_PHONE_NUMBER || 'NOT SET')
    console.log('===================================\n')

    if (!accountSid || !authToken) {
      throw new Error(
        "Twilio credentials are required. Please set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN environment variables.",
      )
    }

    twilioClient = twilio(accountSid, authToken)
  }

  return twilioClient
}

export interface CallOptions {
  to: string
  from: string
  url: string
  method?: "GET" | "POST"
  statusCallback?: string
  statusCallbackMethod?: "GET" | "POST"
  record?: boolean
}

export async function makeCall(options: CallOptions) {
  try {
    const client = getTwilioClient()
    const call = await client.calls.create({
      to: options.to,
      from: options.from,
      url: options.url,
      method: options.method || "POST",
      statusCallback: options.statusCallback,
      statusCallbackMethod: options.statusCallbackMethod || "POST",
      record: options.record || false,
    })

    return call
  } catch (error) {
    console.error("Twilio Call Error:", error)
    throw new Error("Failed to make call")
  }
}

export async function getCallDetails(callSid: string) {
  try {
    const client = getTwilioClient()
    const call = await client.calls(callSid).fetch()
    return call
  } catch (error) {
    console.error("Twilio Get Call Error:", error)
    throw new Error("Failed to get call details")
  }
}
