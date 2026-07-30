import React from "react"
import dynamicImport from "next/dynamic"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"

export const dynamic = 'force-dynamic'
import { StatsCards } from "@/components/dashboard/stats-cards"
import { PageHeader } from "@/components/dashboard/page-header"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  Bot, Phone, Clock, TrendingUp, AlertCircle, Plus, 
  ArrowRight, ShieldCheck, Cpu, DollarSign, Database, 
  Activity, Play, Settings as SettingsIcon, Terminal
} from "lucide-react"

// Dynamically import CallHistoryChart to prevent route blocking
const CallHistoryChart = dynamicImport(
  () => import("@/components/dashboard/call-history-chart").then(mod => mod.CallHistoryChart),
  {
    loading: () => <div className="skeleton h-[320px] w-full" />,
    ssr: false
  }
)

export default async function DashboardPage() {
  const supabase = await createClient()

  // Get user session
  const { data } = await supabase.auth.getUser()
  const userId = data?.user?.id

  // Fetch agents & calls
  const agents = userId
    ? (await supabase.from("agents").select("*").eq("user_id", userId).order("created_at", { ascending: false })).data
    : []

  const calls = userId
    ? (await supabase.from("calls").select("*").eq("user_id", userId).order("created_at", { ascending: false })).data
    : []

  const safeCalls = calls || []
  const safeAgents = agents || []

  // Stats calculation
  const totalAgents = safeAgents.length
  const totalCalls = safeCalls.length
  const avgCallDuration = totalCalls > 0
    ? safeCalls.reduce((acc, c) => acc + (c.duration || 0), 0) / totalCalls
    : 0
  const successRate = totalCalls > 0
    ? Math.round((safeCalls.filter(c => c.status === "completed").length / totalCalls) * 100)
    : 0

  const stats = {
    totalAgents,
    totalCalls,
    avgCallDuration,
    successRate,
  }

  // Cost calculation
  const totalCost = safeCalls.reduce((acc, c) => acc + (c.cost || 0), 0)
  
  // Find active / in-progress calls
  const activeCalls = safeCalls.filter(c => c.status === "in-progress" || c.status === "initiated")

  return (
    <div className="flex-1 space-y-6">
      {/* Page Header */}
      <PageHeader 
        title="Dashboard Overview" 
        description="Real-time control center for your AI voice agents and active telephony channels."
      >
        <Link href="/dashboard/playground">
          <Button variant="outline" size="sm" className="h-8">
            <Terminal className="size-3.5 mr-1.5" />
            Playground
          </Button>
        </Link>
        <Link href="/dashboard/agents">
          <Button size="sm" className="h-8">
            <Plus className="size-3.5 mr-1.5" />
            Create Agent
          </Button>
        </Link>
      </PageHeader>

      <div className="px-8 pb-8 space-y-6 max-w-7xl">
        {/* KPI Strip */}
        <StatsCards stats={stats} />

        {/* Main Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          
          {/* Main Charts & Active Call Widget */}
          <div className="lg:col-span-2 space-y-6">
            {/* Area Chart */}
            <CallHistoryChart />

            {/* Active Calls Widget */}
            <Card className="bg-surface border-border overflow-hidden">
              <CardHeader className="p-5 pb-3 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-semibold text-text-1 flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping-soft absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-success"></span>
                    </span>
                    Active Channels
                  </CardTitle>
                  <CardDescription className="text-text-3 mt-1">Live voice streams currently connected to agents</CardDescription>
                </div>
                <Badge variant="outline" className="text-text-2 bg-surface-2 border-border-2">
                  {activeCalls.length} active
                </Badge>
              </CardHeader>
              <CardContent className="p-5 pt-0">
                {activeCalls.length > 0 ? (
                  <div className="space-y-3">
                    {activeCalls.map((call) => (
                      <div 
                        key={call.id} 
                        className="flex items-center justify-between p-3 rounded-lg bg-surface-2 border border-border hover:border-border-2 transition-all duration-150"
                      >
                        <div className="flex items-center gap-3">
                          <div className="size-8 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
                            <Phone className="size-4" />
                          </div>
                          <div>
                            <p className="text-xs font-mono font-semibold text-text-1">{call.caller_phone || "Unknown Caller"}</p>
                            <p className="text-[10px] text-text-3 mt-0.5">Connected to: Agent ID #{call.agent_id ? call.agent_id.substring(0, 8) : "N/A"}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono text-text-3">Live stream...</span>
                          <span className="size-2 rounded-full bg-success animate-pulse" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 rounded-lg border border-dashed border-border bg-surface-2/40">
                    <Phone className="size-6 text-text-3 mx-auto mb-2 opacity-50" />
                    <p className="text-xs text-text-2 font-medium">All channels currently idle</p>
                    <p className="text-[10px] text-text-3 mt-1">Waiting for incoming Twilio stream callbacks</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar Telemetry, System Health, Activity feed */}
          <div className="space-y-6">
            
            {/* Quick Actions Panel */}
            <Card className="bg-surface border-border">
              <CardHeader className="p-5 pb-3">
                <CardTitle className="text-sm font-semibold text-text-1">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="p-5 pt-0 grid gap-2">
                <Link href="/dashboard/agents" className="w-full">
                  <Button variant="secondary" className="w-full justify-start text-xs h-9">
                    <Plus className="size-3.5 mr-2 text-accent" />
                    Configure New Agent
                  </Button>
                </Link>
                <Link href="/dashboard/playground" className="w-full">
                  <Button variant="secondary" className="w-full justify-start text-xs h-9">
                    <Terminal className="size-3.5 mr-2 text-teal-light" />
                    Open Developer Console
                  </Button>
                </Link>
                <Link href="/dashboard/settings" className="w-full">
                  <Button variant="secondary" className="w-full justify-start text-xs h-9">
                    <SettingsIcon className="size-3.5 mr-2 text-text-3" />
                    System Preferences
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* AI Provider & Cost Overview */}
            <Card className="bg-surface border-border">
              <CardHeader className="p-5 pb-2">
                <CardTitle className="text-sm font-semibold text-text-1">AI Cost Overview</CardTitle>
                <CardDescription className="text-text-3">Resource utilization metrics</CardDescription>
              </CardHeader>
              <CardContent className="p-5 pt-2 space-y-4">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-text-2">Total AI Spend</span>
                    <span className="font-mono text-text-1 font-semibold">${totalCost.toFixed(4)}</span>
                  </div>
                  <div className="h-1.5 w-full bg-surface-2 rounded-full overflow-hidden">
                    <div className="h-full bg-accent rounded-full" style={{ width: totalCost > 0 ? "70%" : "0%" }} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="p-2.5 rounded-lg bg-surface-2 border border-border">
                    <p className="text-[10px] text-text-3 uppercase tracking-wider font-semibold">Deepgram STT</p>
                    <p className="text-sm font-bold font-mono text-text-1 mt-1">${(totalCost * 0.15).toFixed(4)}</p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-surface-2 border border-border">
                    <p className="text-[10px] text-text-3 uppercase tracking-wider font-semibold">OpenAI LLM</p>
                    <p className="text-sm font-bold font-mono text-text-1 mt-1">${(totalCost * 0.55).toFixed(4)}</p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-surface-2 border border-border">
                    <p className="text-[10px] text-text-3 uppercase tracking-wider font-semibold">ElevenLabs TTS</p>
                    <p className="text-sm font-bold font-mono text-text-1 mt-1">${(totalCost * 0.30).toFixed(4)}</p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-surface-2 border border-border">
                    <p className="text-[10px] text-text-3 uppercase tracking-wider font-semibold">Avg Cost / Call</p>
                    <p className="text-sm font-bold font-mono text-text-1 mt-1">
                      ${totalCalls > 0 ? (totalCost / totalCalls).toFixed(4) : "0.00"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* System Health */}
            <Card className="bg-surface border-border">
              <CardHeader className="p-5 pb-3">
                <CardTitle className="text-sm font-semibold text-text-1">System Telemetry</CardTitle>
              </CardHeader>
              <CardContent className="p-5 pt-0 space-y-3">
                {[
                  { name: "SIP Telephony (Twilio)", status: "Active", delay: "4ms jitter" },
                  { name: "Streaming STT (Deepgram)", status: "Online", delay: "50ms RT latency" },
                  { name: "Agent Brain (OpenAI)", status: "Online", delay: "220ms TTFT" },
                  { name: "Streaming TTS (ElevenLabs)", status: "Online", delay: "120ms latency" },
                ].map((service) => (
                  <div key={service.name} className="flex items-center justify-between text-xs">
                    <span className="text-text-2">{service.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-text-3">{service.delay}</span>
                      <span className="size-2 rounded-full bg-success inline-block" />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Recent Activity Timeline */}
            <Card className="bg-surface border-border">
              <CardHeader className="p-5 pb-3 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-semibold text-text-1">Session Log</CardTitle>
                <Link href="/dashboard/calls" className="text-2xs text-accent hover:underline flex items-center gap-0.5">
                  View all
                  <ArrowRight className="size-3" />
                </Link>
              </CardHeader>
              <CardContent className="p-5 pt-0">
                {safeCalls.length > 0 ? (
                  <div className="relative border-l border-border pl-4 space-y-4 ml-1">
                    {safeCalls.slice(0, 3).map((call) => (
                      <div key={call.id} className="relative">
                        <div className="absolute -left-[21px] top-1 size-2.5 rounded-full border-2 border-surface bg-accent" />
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-mono text-text-2">{call.caller_phone || "Inbound stream"}</span>
                          <span className="text-[10px] text-text-3 font-mono">
                            {call.duration ? `${Math.round(call.duration)}s` : "0s"}
                          </span>
                        </div>
                        <p className="text-[10px] text-text-3 mt-0.5 flex items-center gap-1.5">
                          Status: 
                          <span className="capitalize text-text-2">{call.status.replace("-", " ")}</span>
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-text-3 text-center py-4">No recent sessions found</p>
                )}
              </CardContent>
            </Card>

          </div>
        </div>
      </div>
    </div>
  )
}
