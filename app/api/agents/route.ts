import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

  // Get user's workspace_id from workspace_members
  const { data: membership, error: membershipError } = await supabase
    .from("workspace_members")
    .select("workspace_id")
    .eq("user_id", user.id)
    .single()

  if (membershipError || !membership || !membership.workspace_id) {
    console.error("GET agents - workspace membership error for user:", user.id, membershipError)
    return NextResponse.json({ error: "User not associated with any workspace" }, { status: 403 })
  }

  console.log("GET agents - Fetching agents for workspace_id:", membership.workspace_id)

  // Query agents by workspace_id (not user_id)
  const { data: agents, error } = await supabase
    .from("agents")
    .select("id, name, description, system_prompt, voice_id, phone_number, status, model, temperature, max_tokens, assistant_id, workspace_id, created_at, updated_at")
    .eq("workspace_id", membership.workspace_id)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("GET agents - Query error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  console.log("GET agents - Found", agents?.length || 0, "agents")

  // Map assistant_id to assistantId for frontend compatibility
  const agentsWithAssistantId = (agents || []).map(agent => ({
    ...agent,
    assistantId: agent.assistant_id
  }))
  return NextResponse.json({ agents: agentsWithAssistantId })
  } catch (error) {
    console.error("GET agents error:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    
    if (authError) {
      console.error("Auth error:", authError)
      return NextResponse.json({ error: "Authentication error: " + authError.message }, { status: 401 })
    }
    
    if (!user) {
      return NextResponse.json({ error: "No user found - please log in" }, { status: 401 })
    }

    // Get user's workspace_id from workspace_members
    const { data: membership } = await supabase
      .from("workspace_members")
      .select("workspace_id")
      .eq("user_id", user.id)
      .single()

    if (!membership) {
      return NextResponse.json(
        { error: "No workspace found for user" },
        { status: 403 }
      )
    }

    const workspace_id = membership.workspace_id

    // Parse and validate request body
    const body = await request.json()
    const { name, description, voice_id, system_prompt, model, temperature, max_tokens } = body

    if (!name || !system_prompt) {
      return NextResponse.json({ error: "Name and system prompt are required" }, { status: 400 })
    }

    // Log workspace_id before insert
    console.log("POST agent - Creating agent for workspace_id:", workspace_id, "with name:", name)

    // Create the agent with workspace_id
    const { data: agent, error: insertError } = await supabase
      .from("agents")
      .insert({
        name,
        description,
        system_prompt,
        model: model || "gpt-4o",
        voice_id,
        temperature: temperature || 0.7,
        max_tokens: max_tokens || 1000,
        workspace_id,
        status: "active"
      })
      .select()
      .single()

    if (insertError) {
      console.error("POST agent - Insert error:", insertError)
      return NextResponse.json({ error: "Failed to create agent: " + insertError.message }, { status: 500 })
    }

    console.log("POST agent - Successfully created agent:", agent?.id, "for workspace:", workspace_id)

    // Return the newly created agent with assistantId
    return NextResponse.json({ agent: { ...agent, assistantId: agent.assistant_id } }, { status: 201 })
  } catch (error) {
    console.error("Unexpected error:", error)
    return NextResponse.json({ error: "Server error: " + (error instanceof Error ? error.message : String(error)) }, { status: 500 })
  }
}
