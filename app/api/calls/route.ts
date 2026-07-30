import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const agentId = searchParams.get("agent_id")
  const limit = Number.parseInt(searchParams.get("limit") || "50")

  let query = supabase
    .from("calls")
    .select(`
      *,
      agents (
        name,
        description
      )
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(limit)

  if (agentId) {
    query = query.eq("agent_id", agentId)
  }

  const { data: calls, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ calls })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { agent_id, twilio_call_sid, caller_phone, direction } = body

    if (!agent_id || !twilio_call_sid || !caller_phone || !direction) {
      return NextResponse.json(
        {
          error: "agent_id, twilio_call_sid, caller_phone, and direction are required",
        },
        { status: 400 },
      )
    }

    const { data: call, error } = await supabase
      .from("calls")
      .insert({
        user_id: user.id,
        agent_id,
        twilio_call_sid,
        caller_phone,
        direction,
        status: "initiated",
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ call }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }
}
