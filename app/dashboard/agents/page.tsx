"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { AgentsTable } from "@/components/dashboard/agents-table"
import { CallSetupGuide } from "@/components/dashboard/call-setup-guide"
import { PageHeader } from "@/components/dashboard/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Plus, Loader2, Users, Phone, Settings, AlertCircle, Sparkles, CheckCircle } from "lucide-react"
import { toast } from "sonner"

interface Agent {
  id: string
  assistantId: string
  name: string
  description: string | null
  voice_id: string | null
  system_prompt: string
  model: string
  phone_number: string | null
  status: string
  created_at: string
  temperature: number
  max_tokens: number
}

interface SetupStatus {
  twilio_credentials: boolean
  agents_with_phones: number
  base_url: string
}

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [setupStatus, setSetupStatus] = useState<SetupStatus>({
    twilio_credentials: false,
    agents_with_phones: 0,
    base_url: "http://localhost:3002"
  })

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    system_prompt: "",
    voice_id: "",
    model: "gpt-4o",
    temperature: 0.7,
    max_tokens: 200,
  })

  const fetchAgents = async () => {
    try {
      const response = await fetch("/api/agents")
      if (!response.ok) {
        toast.error("Failed to load agents")
        return
      }
      const { agents: agentsData } = await response.json()
      setAgents(agentsData || [])
    } catch {
      toast.error("Failed to load agents")
    } finally {
      setLoading(false)
    }
  }

  const fetchSetupStatus = async () => {
    try {
      const response = await fetch("/api/debug/call-setup")
      if (response.ok) {
        const data = await response.json()
        setSetupStatus({
          twilio_credentials: data.environment?.twilio_account_sid_set && data.environment?.twilio_auth_token_set,
          agents_with_phones: data.agents?.filter((a: any) => a.phone_configured).length || 0,
          base_url: data.environment?.base_url || "http://localhost:3002"
        })
      }
    } catch (error) {
      console.error("Error fetching setup status:", error)
    }
  }

  useEffect(() => {
    fetchAgents()
    fetchSetupStatus()
  }, [])

  const handleCreateAgent = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim() || !formData.system_prompt.trim()) {
      toast.error("Name and system prompt are required")
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch("/api/agents", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to create agent")
      }

      const { agent } = await response.json()
      setAgents((prev) => [agent, ...prev])

      setFormData({
        name: "",
        description: "",
        system_prompt: "",
        voice_id: "",
        model: "gpt-4o",
        temperature: 0.7,
        max_tokens: 200,
      })
      setIsCreateOpen(false)
      toast.success("Agent created successfully!")
    } catch (error: any) {
      toast.error(error.message || "Failed to create agent")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex-1 space-y-6">
        <PageHeader title="AI Voice Agents" description="Configure voice profiles and prompts." />
        <div className="px-8 pb-8 space-y-6 max-w-7xl">
          <div className="grid gap-4 md:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="skeleton h-[90px] w-full" />
            ))}
          </div>
          <div className="skeleton h-[360px] w-full" />
        </div>
      </div>
    )
  }

  const agentsWithPhones = agents.filter(a => a.phone_number).length
  const totalAgents = agents.length

  return (
    <div className="flex-1 space-y-6">
      {/* Header */}
      <PageHeader 
        title="AI Voice Agents" 
        description="Configure voice profiles, instructions, telephony maps, and settings."
      >
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="h-8">
              <Plus className="size-3.5 mr-1.5" /> Create Agent
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-[480px]">
            <form onSubmit={handleCreateAgent}>
              <DialogHeader>
                <DialogTitle>Create Voice Agent</DialogTitle>
                <DialogDescription>Setup base details for a new character profile.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 p-5 max-h-[60vh] overflow-y-auto">
                <div className="grid gap-1.5">
                  <Label htmlFor="create-name">Agent Name *</Label>
                  <Input
                    id="create-name"
                    placeholder="e.g. Inbound Support"
                    value={formData.name}
                    onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>

                <div className="grid gap-1.5">
                  <Label htmlFor="create-description">Description</Label>
                  <Input
                    id="create-description"
                    placeholder="e.g. Handles reservation calls"
                    value={formData.description}
                    onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  />
                </div>

                <div className="grid gap-1.5">
                  <Label htmlFor="create-prompt">Instructions & System Prompt *</Label>
                  <Textarea
                    id="create-prompt"
                    placeholder="You are a helpful virtual assistant..."
                    value={formData.system_prompt}
                    onChange={(e) => setFormData((prev) => ({ ...prev, system_prompt: e.target.value }))}
                    rows={4}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-1.5">
                    <Label htmlFor="create-model">Model</Label>
                    <Select
                      value={formData.model}
                      onValueChange={(value) => setFormData((prev) => ({ ...prev, model: value }))}
                    >
                      <SelectTrigger id="create-model" className="bg-surface-2 border-border-2 rounded-lg text-xs h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="gpt-4o">gpt-4o</SelectItem>
                        <SelectItem value="gpt-4o-mini">gpt-4o-mini</SelectItem>
                        <SelectItem value="llama-3.1-70b-versatile">Llama 3.1 70B</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="create-voice">Voice ID</Label>
                    <Input
                      id="create-voice"
                      placeholder="ElevenLabs ID"
                      value={formData.voice_id}
                      onChange={(e) => setFormData((prev) => ({ ...prev, voice_id: e.target.value }))}
                      className="font-mono text-xs"
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" size="sm" className="h-8" onClick={() => setIsCreateOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" className="h-8" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="size-3.5 mr-1.5 animate-spin" /> : "Create Agent"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </PageHeader>

      <div className="px-8 pb-8 space-y-6 max-w-7xl">
        {/* Simple KPI Stats Strip */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="bg-surface border-border hover:border-border-2 transition-all duration-200">
            <CardHeader className="p-4 flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-2xs font-semibold text-text-2 uppercase tracking-wider">Total Agents</CardTitle>
              <Users className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <p className="text-2xl font-bold text-text-1">{totalAgents}</p>
            </CardContent>
          </Card>

          <Card className="bg-surface border-border hover:border-border-2 transition-all duration-200">
            <CardHeader className="p-4 flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-2xs font-semibold text-text-2 uppercase tracking-wider">Call-Ready Mapping</CardTitle>
              <Phone className="h-4 w-4 text-teal-light" />
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <p className="text-2xl font-bold text-text-1">{agentsWithPhones}</p>
            </CardContent>
          </Card>

          <Card className="bg-surface border-border hover:border-border-2 transition-all duration-200">
            <CardHeader className="p-4 flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-2xs font-semibold text-text-2 uppercase tracking-wider">SIP Telephony Credentials</CardTitle>
              <Settings className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent className="p-4 pt-0 flex items-center gap-2">
              <p className="text-2xl font-bold text-text-1">
                {setupStatus.twilio_credentials ? "Verified" : "Pending"}
              </p>
              {setupStatus.twilio_credentials && <CheckCircle className="size-4 text-success" />}
            </CardContent>
          </Card>
        </div>

        {/* Workspace Tables & Setup Guides */}
        <Tabs defaultValue="agents" className="w-full">
          <TabsList className="flex w-fit bg-surface-2 p-1 rounded-lg border border-border mb-4">
            <TabsTrigger value="agents" className="rounded-md text-xs py-1 px-3">Configured Profiles</TabsTrigger>
            <TabsTrigger value="setup" className="rounded-md text-xs py-1 px-3">Twilio Webhook Guide</TabsTrigger>
          </TabsList>
          
          <TabsContent value="agents" className="space-y-4">
            <AgentsTable agents={agents} />
          </TabsContent>
          
          <TabsContent value="setup" className="space-y-4">
            <CallSetupGuide setupStatus={setupStatus} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
