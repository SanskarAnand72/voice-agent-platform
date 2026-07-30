"use client"

import React, { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { PageHeader } from "@/components/dashboard/page-header"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { 
  ArrowLeft, Save, Bot, Volume2, Shield, 
  Terminal, Sparkles, AlertCircle, Phone, Loader2, Play
} from "lucide-react"
import { toast } from "sonner"

interface Agent {
  id: string
  assistantId: string
  name: string
  description: string | null
  system_prompt: string
  model: string
  voice_id: string | null
  phone_number: string | null
  status: string
  created_at: string
  temperature: number
  max_tokens: number
}

type TabType = "general" | "ai" | "voice" | "prompt" | "testing"

export default function EditAgentPage() {
  const params = useParams()
  const router = useRouter()
  const agentId = params.id as string

  const [activeTab, setActiveTab] = useState<TabType>("general")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testNumber, setTestNumber] = useState("")
  const [testingCall, setTestingCall] = useState(false)

  const [agent, setAgent] = useState<Agent>({
    id: "",
    assistantId: "",
    name: "",
    description: "",
    system_prompt: "",
    model: "gpt-4o",
    voice_id: "",
    phone_number: "",
    status: "inactive",
    created_at: "",
    temperature: 0.7,
    max_tokens: 200
  })

  // Fetch agent details
  const fetchAgent = useCallback(async () => {
    try {
      const response = await fetch(`/api/agents/${agentId}`)
      if (!response.ok) {
        toast.error("Agent not found")
        router.push("/dashboard/agents")
        return
      }
      const data = await response.json()
      if (data.agent) {
        setAgent({
          ...data.agent,
          description: data.agent.description || "",
          voice_id: data.agent.voice_id || "",
          phone_number: data.agent.phone_number || "",
        })
      }
    } catch {
      toast.error("Failed to load agent settings")
    } finally {
      setLoading(false)
    }
  }, [agentId, router])

  useEffect(() => {
    fetchAgent()
  }, [fetchAgent])

  // Save edits
  const handleSave = async () => {
    setSaving(true)
    try {
      const response = await fetch(`/api/agents/${agentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: agent.name,
          description: agent.description,
          phone_number: agent.phone_number,
          system_prompt: agent.system_prompt,
          voice_id: agent.voice_id,
          model: agent.model,
          temperature: agent.temperature,
          max_tokens: agent.max_tokens,
          is_active: agent.status === "active",
        }),
      })

      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error || "Failed to save settings")
      }

      toast.success("Agent settings saved successfully")
    } catch (err: any) {
      toast.error(err.message || "Failed to save settings")
    } finally {
      setSaving(false)
    }
  }

  // Trigger test call
  const handleTestCall = async () => {
    if (!testNumber) {
      toast.error("Please enter a phone number to test")
      return
    }
    if (!/^\+[1-9]\d{1,14}$/.test(testNumber)) {
      toast.error("Please enter a valid E.164 phone number (e.g. +1234567890)")
      return
    }
    if (agent.status !== "active") {
      toast.error("Please activate the agent status before testing")
      return
    }

    setTestingCall(true)
    try {
      const response = await fetch("/api/twilio/make-call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agent_id: agentId, to_phone: testNumber }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Failed to trigger call")

      toast.success(`Test call initiated! Call SID: ${data.call_sid}`)
    } catch (err: any) {
      toast.error(err.message || "Failed to trigger call")
    } finally {
      setTestingCall(false)
    }
  }

  if (loading) {
    return (
      <div className="flex-1 space-y-6 p-8">
        <div className="skeleton h-[48px] w-64" />
        <div className="grid gap-6 lg:grid-cols-4 pt-4">
          <div className="skeleton h-[200px]" />
          <div className="lg:col-span-3 skeleton h-[400px]" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-bg">
      {/* Page Header */}
      <PageHeader 
        title={`Configure Agent: ${agent.name}`} 
        description={`Customize character instructions, speech synthesis configurations, and telephony channels.`}
      >
        <Link href="/dashboard/agents">
          <Button variant="outline" size="sm" className="h-8">
            <ArrowLeft className="size-3.5 mr-1.5" />
            Back to List
          </Button>
        </Link>
        <Button size="sm" className="h-8" onClick={handleSave} disabled={saving}>
          {saving ? (
            <Loader2 className="size-3.5 mr-1.5 animate-spin" />
          ) : (
            <Save className="size-3.5 mr-1.5" />
          )}
          Save Settings
        </Button>
      </PageHeader>

      {/* Main Workspace layout */}
      <div className="flex-1 flex overflow-hidden max-w-7xl w-full mx-auto p-8 gap-8">
        
        {/* Navigation Sidebar (Left) */}
        <aside className="w-56 shrink-0 flex flex-col gap-1.5">
          {[
            { id: "general", label: "General Settings", desc: "Identity & status", icon: Bot },
            { id: "ai",      label: "AI Model Config",  desc: "Parameters & brain", icon: Sparkles },
            { id: "voice",   label: "Voice Customizer", desc: "Synthesis voice id", icon: Volume2 },
            { id: "prompt",  label: "System Prompt",    desc: "Instructions code", icon: Terminal },
            { id: "testing", label: "Interactive Test", desc: "Trigger test call", icon: Phone },
          ].map((t) => {
            const Icon = t.icon
            const isTabActive = activeTab === t.id
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id as TabType)}
                className={`flex items-start gap-3 p-3 rounded-lg text-left transition-all duration-150 ${
                  isTabActive 
                    ? "bg-accent/10 border border-accent/20 text-accent-light" 
                    : "border border-transparent text-text-2 hover:bg-surface-2 hover:text-text-1"
                }`}
              >
                <Icon className={`size-4 mt-0.5 ${isTabActive ? "text-accent" : "text-text-3"}`} />
                <div>
                  <p className="text-xs font-semibold leading-none">{t.label}</p>
                  <p className="text-[10px] text-text-3 mt-1 leading-none">{t.desc}</p>
                </div>
              </button>
            )
          })}
        </aside>

        {/* Section Work Area (Right) */}
        <main className="flex-1 overflow-y-auto pr-2 pb-16">
          <div className="space-y-6 animate-page-in">
            
            {/* GENERAL SECTION */}
            {activeTab === "general" && (
              <Card className="bg-surface border-border">
                <CardHeader className="p-5 pb-3">
                  <CardTitle className="text-sm font-semibold text-text-1">General Settings</CardTitle>
                  <CardDescription className="text-text-3">Configure basic identifiers and mapping status.</CardDescription>
                </CardHeader>
                <CardContent className="p-5 pt-0 space-y-4">
                  <div className="grid gap-1.5">
                    <Label htmlFor="agent-name">Agent Name *</Label>
                    <Input 
                      id="agent-name" 
                      value={agent.name} 
                      onChange={(e) => setAgent({...agent, name: e.target.value})}
                      required
                    />
                  </div>

                  <div className="grid gap-1.5">
                    <Label htmlFor="agent-desc">Description</Label>
                    <Input 
                      id="agent-desc" 
                      value={agent.description || ""} 
                      onChange={(e) => setAgent({...agent, description: e.target.value})}
                    />
                  </div>

                  <div className="grid gap-1.5">
                    <Label htmlFor="agent-phone">Twilio Phone Number Mapping</Label>
                    <Input 
                      id="agent-phone" 
                      placeholder="e.g. +18303965439" 
                      value={agent.phone_number || ""} 
                      onChange={(e) => setAgent({...agent, phone_number: e.target.value})}
                      className="font-mono"
                    />
                    <p className="text-[10px] text-text-3">Incoming Twilio Webhook callbacks to this number will map directly to this agent.</p>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg bg-surface-2 border border-border mt-2">
                    <div>
                      <p className="text-xs font-semibold text-text-1">Active Status</p>
                      <p className="text-[10px] text-text-3 mt-0.5">Activate to enable handling live telephone calls.</p>
                    </div>
                    <Switch 
                      checked={agent.status === "active"}
                      onCheckedChange={(checked) => setAgent({...agent, status: checked ? "active" : "inactive"})}
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* AI MODEL CONFIG */}
            {activeTab === "ai" && (
              <Card className="bg-surface border-border">
                <CardHeader className="p-5 pb-3">
                  <CardTitle className="text-sm font-semibold text-text-1">AI Model Config</CardTitle>
                  <CardDescription className="text-text-3">Tweak parameters that govern LLM response generation.</CardDescription>
                </CardHeader>
                <CardContent className="p-5 pt-0 space-y-5">
                  <div className="grid gap-1.5">
                    <Label htmlFor="agent-model">Language Model Brain</Label>
                    <Select 
                      value={agent.model} 
                      onValueChange={(val) => setAgent({...agent, model: val})}
                    >
                      <SelectTrigger id="agent-model" className="bg-surface-2 border-border-2 rounded-lg text-sm h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="gpt-4o">gpt-4o (OpenAI Recommended)</SelectItem>
                        <SelectItem value="gpt-4o-mini">gpt-4o-mini (Faster Latency)</SelectItem>
                        <SelectItem value="llama-3.1-70b-versatile">Llama 3.1 70B (Open-Source)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <Label htmlFor="agent-temp">Temperature</Label>
                      <span className="font-mono text-text-2">{agent.temperature}</span>
                    </div>
                    <input 
                      id="agent-temp"
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={agent.temperature}
                      onChange={(e) => setAgent({...agent, temperature: parseFloat(e.target.value)})}
                      className="w-full accent-accent cursor-pointer"
                    />
                    <div className="flex justify-between text-[9px] text-text-3 font-semibold">
                      <span>PREDICTABLE & FOCUSED</span>
                      <span>CREATIVE & RANDOM</span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <Label htmlFor="agent-tokens">Max Tokens / Response</Label>
                      <span className="font-mono text-text-2">{agent.max_tokens}</span>
                    </div>
                    <input 
                      id="agent-tokens"
                      type="range"
                      min="50"
                      max="1000"
                      step="50"
                      value={agent.max_tokens}
                      onChange={(e) => setAgent({...agent, max_tokens: parseInt(e.target.value)})}
                      className="w-full accent-accent cursor-pointer"
                    />
                    <p className="text-[10px] text-text-3">Voice synthesis works best with concise responses (under 200 tokens) to reduce user barge-in probability.</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* VOICE ID SELECTION */}
            {activeTab === "voice" && (
              <Card className="bg-surface border-border">
                <CardHeader className="p-5 pb-3">
                  <CardTitle className="text-sm font-semibold text-text-1">Voice Customizer</CardTitle>
                  <CardDescription className="text-text-3">Configure character vocal identity via ElevenLabs API key.</CardDescription>
                </CardHeader>
                <CardContent className="p-5 pt-0 space-y-4">
                  <div className="grid gap-1.5">
                    <Label htmlFor="agent-voice">ElevenLabs Voice ID</Label>
                    <Input 
                      id="agent-voice" 
                      placeholder="e.g. 21m00Tcm4TlvDq8ikWAM" 
                      value={agent.voice_id || ""} 
                      onChange={(e) => setAgent({...agent, voice_id: e.target.value})}
                      className="font-mono"
                    />
                  </div>
                  <div className="p-3 rounded-lg border border-border bg-surface-2/50 text-xs text-text-3 leading-relaxed flex items-start gap-2.5">
                    <Volume2 className="size-4 text-accent shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-text-2 block">Voice Synthesis Integration</span>
                      Ensure the respective ElevenLabs API key is saved in System Settings. You can grab any custom voice ID from the ElevenLabs Voice Library.
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* SYSTEM PROMPT Instructions */}
            {activeTab === "prompt" && (
              <Card className="bg-surface border-border">
                <CardHeader className="p-5 pb-3">
                  <CardTitle className="text-sm font-semibold text-text-1">Instructions & Guidelines</CardTitle>
                  <CardDescription className="text-text-3">Define instructions code that sets character tone and call criteria.</CardDescription>
                </CardHeader>
                <CardContent className="p-5 pt-0 space-y-3">
                  <div className="grid gap-1.5">
                    <Label htmlFor="agent-prompt">System Prompt</Label>
                    <Textarea 
                      id="agent-prompt" 
                      value={agent.system_prompt} 
                      onChange={(e) => setAgent({...agent, system_prompt: e.target.value})}
                      rows={14}
                      className="font-mono text-xs leading-relaxed"
                    />
                  </div>
                  <p className="text-[10px] text-text-3">Tip: Always instruct the agent to be brief, clear, and ask simple clarifying questions to keep verbal turn-taking natural.</p>
                </CardContent>
              </Card>
            )}

            {/* INTERACTIVE TELEPHONE TESTING */}
            {activeTab === "testing" && (
              <Card className="bg-surface border-border">
                <CardHeader className="p-5 pb-3">
                  <CardTitle className="text-sm font-semibold text-text-1">Interactive Telephony Tester</CardTitle>
                  <CardDescription className="text-text-3">Trigger an immediate outbound call to test character settings and voice latency.</CardDescription>
                </CardHeader>
                <CardContent className="p-5 pt-0 space-y-4">
                  <div className="grid gap-1.5">
                    <Label htmlFor="test-phone">Destination Phone Number</Label>
                    <div className="flex gap-2">
                      <Input 
                        id="test-phone" 
                        placeholder="e.g. +1234567890" 
                        value={testNumber} 
                        onChange={(e) => setTestNumber(e.target.value)}
                        className="font-mono"
                      />
                      <Button size="sm" className="h-9" onClick={handleTestCall} disabled={testingCall}>
                        {testingCall ? (
                          <Loader2 className="size-3.5 mr-1.5 animate-spin" />
                        ) : (
                          <Play className="size-3.5 mr-1.5" />
                        )}
                        Trigger Call
                      </Button>
                    </div>
                    <p className="text-[10px] text-text-3">Make sure format matches E.164 (country code + area + number).</p>
                  </div>
                </CardContent>
              </Card>
            )}

          </div>
        </main>
      </div>
    </div>
  )
}
