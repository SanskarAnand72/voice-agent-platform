import { createClient } from "@/lib/supabase/server"
import type { NextRequest } from "next/server"

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) {
    return new Response("Unauthorized", { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const callId = searchParams.get("call_id")

  if (!callId) {
    return new Response("call_id is required", { status: 400 })
  }

  // Create Server-Sent Events stream
  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    start(controller) {
      // Send initial connection message
      const data = `data: ${JSON.stringify({ type: "connected", callId })}\n\n`
      controller.enqueue(encoder.encode(data))

      // Set up real-time subscription to call logs
      const subscription = supabase
        .channel(`call-logs-${callId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "call_logs",
            filter: `call_id=eq.${callId}`,
          },
          (payload) => {
            const logData = `data: ${JSON.stringify({
              type: "new_log",
              data: payload.new,
            })}\n\n`
            controller.enqueue(encoder.encode(logData))
          },
        )
        .subscribe()

      // Clean up on close
      request.signal.addEventListener("abort", () => {
        subscription.unsubscribe()
        controller.close()
      })
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  })
}
