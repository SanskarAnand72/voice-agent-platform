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

  // Create Server-Sent Events stream for call status updates
  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    start(controller) {
      // Send initial connection message
      const data = `data: ${JSON.stringify({ type: "connected" })}\n\n`
      controller.enqueue(encoder.encode(data))

      // Set up real-time subscription to calls
      const subscription = supabase
        .channel("call-status-updates")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "calls",
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            const statusData = `data: ${JSON.stringify({
              type: "call_status_update",
              data: payload.new || payload.old,
              eventType: payload.eventType,
            })}\n\n`
            controller.enqueue(encoder.encode(statusData))
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
