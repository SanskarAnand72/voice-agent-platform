import { createClient } from "@/lib/supabase/server"
import { LiveTranscript } from "@/components/realtime/live-transcript"
import { CallStatusMonitor } from "@/components/realtime/call-status-monitor"
import { LiveMetrics } from "@/components/realtime/live-metrics"

export const dynamic = 'force-dynamic'

export default async function MonitoringPage() {
  const supabase = await createClient()

  // Try to get user — no redirect if not logged in
  const { data } = await supabase.auth.getUser()
  const userId = data?.user?.id

  // Get recent active call (if user session exists)
  const recentCall = userId
    ? (
        await supabase
          .from("calls")
          .select("*")
          .eq("user_id", userId)
          .eq("status", "in-progress")
          .order("started_at", { ascending: false })
          .limit(1)
          .single()
      ).data
    : null

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Live Monitoring</h1>
          <p className="text-muted-foreground">Monitor active calls and real-time performance metrics.</p>
        </div>
      </div>

      {/* Live Metrics */}
      <LiveMetrics />

      {/* Real-time Monitoring Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Call Status Monitor */}
        <CallStatusMonitor />

        {/* Live Transcript */}
        {recentCall ? (
          <LiveTranscript callId={recentCall.id} />
        ) : (
          <div className="bg-card rounded-lg border border-border p-8 text-center">
            <h3 className="text-lg font-semibold text-card-foreground mb-2">No Active Calls</h3>
            <p className="text-muted-foreground">Live transcripts will appear here when calls are in progress.</p>
          </div>
        )}
      </div>
    </div>
  )
}
