import { createClient } from "@/lib/supabase/server"
import { generateAIResponse } from "@/lib/ai/groq"
import { type NextRequest, NextResponse } from "next/server"

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
    const { agent_id, call_id, user_message } = body

    if (!agent_id || !call_id || !user_message) {
      return NextResponse.json({ error: "agent_id, call_id, and user_message are required" }, { status: 400 })
    }

    // Get agent configuration
    const { data: agent, error: agentError } = await supabase
      .from("agents")
      .select("*")
      .eq("id", agent_id)
      .eq("user_id", user.id)
      .single()

    if (agentError || !agent) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 })
    }

    // Log user message
    await supabase.from("call_logs").insert({
      call_id,
      user_id: user.id,
      type: "user_speech",
      content: user_message,
      timestamp_ms: Date.now(),
      confidence: 1.0,
    })

    // Generate AI response
    const aiResponse = await generateAIResponse(
      agent.system_prompt,
      user_message,
      agent.model,
      agent.temperature,
      agent.max_tokens,
    )

    // Log AI response
    await supabase.from("call_logs").insert({
      call_id,
      user_id: user.id,
      type: "ai_response",
      content: aiResponse.text,
      timestamp_ms: Date.now(),
    })

    return NextResponse.json({
      response: aiResponse.text,
      usage: aiResponse.usage,
    })
  } catch (error) {
    console.error("Conversation API Error:", error)
    return NextResponse.json({ error: "Failed to process conversation" }, { status: 500 })
  }
}
