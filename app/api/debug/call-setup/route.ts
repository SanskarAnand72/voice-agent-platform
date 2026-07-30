import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check environment variables
    const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID
    const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN
    const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || `${request.headers.get('x-forwarded-proto') || 'http'}://${request.headers.get('host')}`

    // Log environment variables verification
    console.log('=== Debug Call Setup Check ===')
    console.log('TWILIO_ACCOUNT_SID:', twilioAccountSid ? `${twilioAccountSid.substring(0, 10)}...` : 'NOT SET')
    console.log('TWILIO_AUTH_TOKEN:', twilioAuthToken ? `${twilioAuthToken.substring(0, 10)}...` : 'NOT SET')
    console.log('TWILIO_PHONE_NUMBER:', twilioPhoneNumber || 'NOT SET')
    console.log('BASE_URL:', baseUrl)
    console.log('==============================\n')

    // Check agents
    const { data: agents, error: agentsError } = await supabase
      .from("agents")
      .select("id, name, phone_number, is_active")
      .eq("user_id", user.id)

    return NextResponse.json({
      status: "ok",
      user_id: user.id,
      environment: {
        twilio_account_sid_set: !!twilioAccountSid,
        twilio_auth_token_set: !!twilioAuthToken,
        twilio_phone_number_set: !!twilioPhoneNumber,
        base_url: baseUrl,
      },
      agents: agents?.map(agent => ({
        id: agent.id,
        name: agent.name,
        phone_number: agent.phone_number,
        is_active: agent.is_active,
        phone_configured: !!agent.phone_number,
      })) || [],
      agents_error: agentsError?.message,
      webhooks: {
        outbound: `${baseUrl}/api/twilio/webhook/outbound`,
        status: `${baseUrl}/api/twilio/webhook/status`,
        make_call: `${baseUrl}/api/twilio/make-call`,
      }
    })
  } catch (error) {
    console.error("Debug endpoint error:", error)
    return NextResponse.json({ 
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}
