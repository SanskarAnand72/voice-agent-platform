"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
// Checkbox from shadcn not yet installed — using native HTML input
import { Switch } from "@/components/ui/switch"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger
} from "@/components/ui/dialog"
import { Webhook, Plus, Trash2, CheckCircle, XCircle, Clock, Copy, ExternalLink, Zap } from "lucide-react"
import { toast } from "sonner"
import { format } from "date-fns"

const ALL_EVENTS = [
  { id: "call_started", label: "Call Started", description: "When a call begins" },
  { id: "call_completed", label: "Call Completed", description: "When a call ends successfully" },
  { id: "call_failed", label: "Call Failed", description: "When a call fails or is rejected" },
  { id: "transcript_ready", label: "Transcript Ready", description: "When a conversation turn is transcribed" },
  { id: "recording_ready", label: "Recording Ready", description: "When call recording is available" },
]

interface WebhookItem {
  id: string
  name: string
  url: string
  events: string[]
  is_active: boolean
  last_triggered_at: string | null
  failure_count: number
  created_at: string
}

export default function WebhooksPage() {
  const [webhooks, setWebhooks] = useState<WebhookItem[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [form, setForm] = useState({
    name: "",
    url: "",
    secret: "",
    events: ["call_started", "call_completed", "transcript_ready"] as string[],
  })

  const fetchWebhooks = useCallback(async () => {
    try {
      const res = await fetch("/api/webhooks")
      if (res.ok) {
        const { webhooks: data } = await res.json()
        setWebhooks(data || [])
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchWebhooks() }, [fetchWebhooks])

  const toggleEvent = (eventId: string) => {
    setForm(prev => ({
      ...prev,
      events: prev.events.includes(eventId)
        ? prev.events.filter(e => e !== eventId)
        : [...prev.events, eventId],
    }))
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim() || !form.url.trim() || form.events.length === 0) {
      toast.error("Name, URL, and at least one event are required")
      return
    }
    setIsCreating(true)
    try {
      const res = await fetch("/api/webhooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setWebhooks(prev => [data.webhook, ...prev])
      setIsCreateOpen(false)
      setForm({ name: "", url: "", secret: "", events: ["call_started", "call_completed"] })
      toast.success("Webhook created!")
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to create webhook")
    } finally {
      setIsCreating(false)
    }
  }

  const toggleActive = async (id: string, current: boolean) => {
    const res = await fetch(`/api/webhooks?id=${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: !current }),
    })
    if (res.ok) {
      setWebhooks(prev => prev.map(w => w.id === id ? { ...w, is_active: !current } : w))
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete webhook "${name}"?`)) return
    const res = await fetch(`/api/webhooks?id=${id}`, { method: "DELETE" })
    if (res.ok) {
      setWebhooks(prev => prev.filter(w => w.id !== id))
      toast.success("Webhook deleted")
    }
  }

  return (
    <div className="flex-1 space-y-8 p-6 sm:p-8 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold text-text tracking-tight">Webhooks</h1>
          <p className="text-muted mt-1">Configure endpoints to receive real-time call events.</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-accent text-white hover:bg-accent/90">
              <Plus className="h-4 w-4 mr-2" /> Add Webhook
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <form onSubmit={handleCreate}>
              <DialogHeader>
                <DialogTitle>Add Webhook</DialogTitle>
                <DialogDescription>
                  We'll POST a JSON payload to your URL when events occur.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label htmlFor="wh-name">Name</Label>
                  <Input id="wh-name" placeholder="e.g. Slack notifications" className="mt-1"
                    value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required />
                </div>
                <div>
                  <Label htmlFor="wh-url">Endpoint URL</Label>
                  <Input id="wh-url" type="url" placeholder="https://your-server.com/webhook" className="mt-1"
                    value={form.url} onChange={e => setForm(p => ({ ...p, url: e.target.value }))} required />
                </div>
                <div>
                  <Label htmlFor="wh-secret">Secret (optional, for HMAC verification)</Label>
                  <Input id="wh-secret" placeholder="your-webhook-secret" className="mt-1"
                    value={form.secret} onChange={e => setForm(p => ({ ...p, secret: e.target.value }))} />
                </div>
                <div>
                  <Label className="mb-2 block">Events to subscribe to</Label>
                  <div className="space-y-2">
                    {ALL_EVENTS.map(ev => (
                      <div key={ev.id} className="flex items-center gap-3 p-3 bg-surface rounded-lg border border-default cursor-pointer hover:border-accent/50 transition-colors"
                        onClick={() => toggleEvent(ev.id)}>
                        <input type="checkbox" checked={form.events.includes(ev.id)} onChange={() => toggleEvent(ev.id)} className="w-4 h-4 accent-accent" />
                        <div>
                          <p className="text-sm font-medium text-text">{ev.label}</p>
                          <p className="text-xs text-muted">{ev.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={isCreating}>
                  {isCreating ? "Creating…" : "Create Webhook"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Payload format */}
      <Card className="bg-elevated border-default">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Zap className="h-4 w-4 text-accent" /> Event Payload Format
          </CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="bg-surface text-xs font-mono text-text p-4 rounded-xl border border-default overflow-x-auto">{`{
  "event": "call_completed",
  "timestamp": "2024-01-15T12:34:56.789Z",
  "data": {
    "call_id": "uuid",
    "call_sid": "CA...",
    "agent_id": "uuid",
    "status": "completed",
    "duration": 120,
    "recording_url": "https://...",
    "caller_phone": "+1234567890"
  }
}`}</pre>
          <p className="text-xs text-muted mt-2">
            Signature: <code className="text-accent">X-VoiceAI-Signature: sha256=HMAC-SHA256(secret, body)</code>
          </p>
        </CardContent>
      </Card>

      {/* Webhooks list */}
      <Card className="bg-elevated border-default">
        <CardHeader>
          <CardTitle>Configured Webhooks</CardTitle>
          <CardDescription>{webhooks.length} webhook{webhooks.length !== 1 ? "s" : ""}</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="animate-pulse space-y-3">
              {[1, 2].map(i => <div key={i} className="h-20 bg-surface rounded-xl" />)}
            </div>
          ) : webhooks.length === 0 ? (
            <div className="text-center py-10 text-muted">
              <Webhook className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p>No webhooks yet. Add one to receive call events.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {webhooks.map(wh => (
                <div key={wh.id} className="p-4 bg-surface rounded-xl border border-default group">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-text">{wh.name}</p>
                        {wh.failure_count > 0 && (
                          <Badge variant="danger" className="text-xs">{wh.failure_count} failures</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <code className="text-xs text-muted truncate max-w-xs">{wh.url}</code>
                        <Button size="sm" variant="ghost" className="h-5 w-5 p-0 shrink-0"
                          onClick={() => { navigator.clipboard.writeText(wh.url); toast.success("URL copied") }}>
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {wh.events.map(ev => (
                          <Badge key={ev} variant="secondary" className="text-xs">{ev}</Badge>
                        ))}
                      </div>
                      {wh.last_triggered_at && (
                        <p className="text-xs text-muted mt-1 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Last triggered {format(new Date(wh.last_triggered_at), 'MMM d, h:mm a')}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <Switch
                        checked={wh.is_active}
                        onCheckedChange={() => toggleActive(wh.id, wh.is_active)}
                      />
                      <Button
                        variant="ghost" size="sm"
                        className="text-red-400 hover:text-red-300 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleDelete(wh.id, wh.name)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
