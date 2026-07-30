import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data: logs, error } = await supabase
    .from("call_logs")
    .select("*")
    .eq("call_id", params.id)
    .eq("user_id", user.id)
    .order("timestamp_ms", { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ logs })
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
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
    const { type, content, timestamp_ms, confidence } = body

    if (!type || !content || timestamp_ms === undefined) {
      return NextResponse.json(
        {
          error: "type, content, and timestamp_ms are required",
        },
        { status: 400 },
      )
    }

    const { data: log, error } = await supabase
      .from("call_logs")
      .insert({
        call_id: params.id,
        user_id: user.id,
        type,
        content,
        timestamp_ms,
        confidence,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ log }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }
}
