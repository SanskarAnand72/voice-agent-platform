"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Key, Plus, Trash2, Copy, Eye, EyeOff, AlertTriangle, CheckCircle, Clock } from "lucide-react"
import { toast } from "sonner"
import { format } from "date-fns"

interface ApiKey {
  id: string
  name: string
  key_prefix: string
  scopes: string[]
  is_active: boolean
  last_used_at: string | null
  expires_at: string | null
  created_at: string
}

interface NewKey {
  id: string
  name: string
  key: string
  key_prefix: string
  created_at: string
}

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKey[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [newKey, setNewKey] = useState<NewKey | null>(null)
  const [showKey, setShowKey] = useState(false)
  const [form, setForm] = useState({ name: "" })

  const fetchKeys = useCallback(async () => {
    try {
      const res = await fetch("/api/api-keys")
      if (res.ok) {
        const { keys: data } = await res.json()
        setKeys(data || [])
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchKeys() }, [fetchKeys])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) { toast.error("Name is required"); return }
    setIsCreating(true)
    try {
      const res = await fetch("/api/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.name }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setNewKey(data)
      setShowKey(true)
      setIsCreateOpen(false)
      setForm({ name: "" })
      await fetchKeys()
      toast.success("API key created — save it now!")
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to create key")
    } finally {
      setIsCreating(false)
    }
  }

  const handleRevoke = async (id: string, name: string) => {
    if (!confirm(`Revoke "${name}"? This cannot be undone.`)) return
    const res = await fetch(`/api/api-keys?id=${id}`, { method: "DELETE" })
    if (res.ok) {
      setKeys(prev => prev.filter(k => k.id !== id))
      toast.success("API key revoked")
    } else {
      toast.error("Failed to revoke key")
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success("Copied to clipboard!")
  }

  return (
    <div className="flex-1 space-y-8 p-6 sm:p-8 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold text-text tracking-tight">API Keys</h1>
          <p className="text-muted mt-1">Generate keys to access the VoiceAI API and integrate with n8n.</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-accent text-white hover:bg-accent/90">
              <Plus className="h-4 w-4 mr-2" /> Generate Key
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <form onSubmit={handleCreate}>
              <DialogHeader>
                <DialogTitle>Generate API Key</DialogTitle>
                <DialogDescription>
                  Give your key a descriptive name. The key will only be shown once.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <Label htmlFor="key-name">Key Name</Label>
                <Input
                  id="key-name"
                  placeholder="e.g. n8n automation, production"
                  value={form.name}
                  onChange={e => setForm({ name: e.target.value })}
                  className="mt-2"
                  required
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={isCreating}>
                  {isCreating ? "Generating…" : "Generate"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* One-time key display */}
      {newKey && (
        <Alert className="border-amber-500/50 bg-amber-500/10">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          <AlertDescription className="space-y-3">
            <p className="font-semibold text-amber-200">⚠️ Save your API key now — it won't be shown again!</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-black/40 rounded-lg px-3 py-2 text-sm font-mono text-green-400 break-all">
                {showKey ? newKey.key : newKey.key.replace(/./g, '•')}
              </code>
              <Button size="sm" variant="ghost" onClick={() => setShowKey(s => !s)}>
                {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => copyToClipboard(newKey.key)}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <Button size="sm" variant="ghost" className="text-amber-400" onClick={() => setNewKey(null)}>
              Dismiss (I've saved the key)
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* API Usage Example */}
      <Card className="bg-elevated border-default">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Key className="h-4 w-4 text-accent" /> Usage Example
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div
              className="bg-surface rounded-xl p-4 font-mono text-xs text-text border border-default cursor-pointer hover:bg-elevated/50 transition-colors"
              onClick={() => copyToClipboard(`curl -X POST ${process.env.NEXT_PUBLIC_BASE_URL || 'https://yourdomain.com'}/v1/calls \\
  -H "Authorization: Bearer vapi_sk_YOUR_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"assistant_id":"asst_xxx","to_phone":"+1234567890"}'`)}
              title="Click to copy"
            >
              <pre className="whitespace-pre-wrap text-xs">{`# Trigger an outbound call (n8n compatible)
curl -X POST ${typeof window !== 'undefined' ? window.location.origin : 'https://yourdomain.com'}/v1/calls \\
  -H "Authorization: Bearer vapi_sk_YOUR_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"assistant_id":"asst_xxx","to_phone":"+1234567890"}'`}</pre>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Keys List */}
      <Card className="bg-elevated border-default">
        <CardHeader>
          <CardTitle>Your API Keys</CardTitle>
          <CardDescription>{keys.length} key{keys.length !== 1 ? "s" : ""}</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="animate-pulse space-y-3">
              {[1, 2].map(i => <div key={i} className="h-16 bg-surface rounded-xl" />)}
            </div>
          ) : keys.length === 0 ? (
            <div className="text-center py-10 text-muted">
              <Key className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p>No API keys yet. Generate one to get started.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {keys.map(key => (
                <div key={key.id} className="flex items-center justify-between p-4 bg-surface rounded-xl border border-default group">
                  <div className="flex items-start gap-4">
                    <div className={`mt-0.5 w-2 h-2 rounded-full ${key.is_active ? 'bg-green-400' : 'bg-red-400'}`} />
                    <div>
                      <p className="font-semibold text-text">{key.name}</p>
                      <code className="text-xs text-muted">{key.key_prefix}</code>
                      <div className="flex gap-2 mt-1 flex-wrap">
                        {key.scopes.map(s => (
                          <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right text-xs text-muted hidden sm:block">
                      {key.last_used_at ? (
                        <div className="flex items-center gap-1">
                          <CheckCircle className="h-3 w-3 text-green-400" />
                          Used {format(new Date(key.last_used_at), 'MMM d')}
                        </div>
                      ) : (
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Never used
                        </div>
                      )}
                      <div>Created {format(new Date(key.created_at), 'MMM d, yyyy')}</div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-400 hover:text-red-300 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleRevoke(key.id, key.name)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
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
