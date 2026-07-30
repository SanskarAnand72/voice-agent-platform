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

  // Get user's workspace_id from workspace_members
  const { data: membership, error: membershipError } = await supabase
    .from("workspace_members")
    .select("workspace_id")
    .eq("user_id", user.id)
    .single()

  if (membershipError || !membership) {
    return NextResponse.json({ error: "User not associated with any workspace" }, { status: 403 })
  }

  const { data: agent, error } = await supabase
    .from("agents")
    .select("*")
    .eq("id", params.id)
    .eq("workspace_id", membership.workspace_id)
    .single()

  if (error) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 })
  }

  return NextResponse.json({ agent })
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    // Get user's workspace_id from workspace_members
    const { data: membership, error: membershipError } = await supabase
      .from("workspace_members")
      .select("workspace_id")
      .eq("user_id", user.id)
      .single()

    if (membershipError || !membership) {
      return NextResponse.json({ error: "User not associated with any workspace" }, { status: 403 })
    }

    const body = await request.json()
    const { name, description, voice_id, system_prompt, model, temperature, max_tokens, is_active, phone_number } = body

    const { data: agent, error } = await supabase
      .from("agents")
      .update({
        name,
        description,
        voice_id,
        system_prompt,
        model,
        temperature,
        max_tokens,
        is_active,
        phone_number,
      })
      .eq("id", params.id)
      .eq("workspace_id", membership.workspace_id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ agent })
  } catch (error) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
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

  if (membershipError || !membership) {
    return NextResponse.json({ error: "User not associated with any workspace" }, { status: 403 })
  }

  const { error } = await supabase.from("agents").delete().eq("id", params.id).eq("workspace_id", membership.workspace_id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ message: "Agent deleted successfully" })
}
