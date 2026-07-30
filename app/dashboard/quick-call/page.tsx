'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Phone, CheckCircle, AlertCircle } from 'lucide-react'

export default function QuickCallTest() {
  const [toNumber, setToNumber] = useState('+917078716503')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string; sid?: string } | null>(null)
  const [agents, setAgents] = useState<{ id: string; name: string }[]>([])
  const [selectedAgent, setSelectedAgent] = useState<string>('')

  useEffect(() => {
    async function fetchAgents() {
      const res = await fetch('/api/agents')
      if (res.ok) {
        const data = await res.json()
        setAgents(data.agents || [])
        if (data.agents && data.agents.length > 0) {
          setSelectedAgent(data.agents[0].id)
        }
      }
    }
    fetchAgents()
  }, [])

  const handleCall = async () => {
    setLoading(true)
    setResult(null)

    try {
      const response = await fetch('/api/twilio/make-call', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: toNumber,
          agent_id: selectedAgent
        }),
      })

      const data = await response.json()
      
      if (response.ok) {
        setResult({
          success: true,
          message: data.message || 'Call initiated successfully!',
          sid: data.sid
        })
      } else {
        setResult({
          success: false,
          message: `Error: ${data.error} ${data.details ? `- ${data.details}` : ''}`
        })
      }
    } catch (error) {
      setResult({
        success: false,
        message: `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[var(--bg)] to-[var(--surface)] p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <Card className="bg-[var(--elevated)] border-[var(--border)]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[var(--text)]">
              <Phone className="h-5 w-5" />
              Quick Call Test
            </CardTitle>
            <CardDescription className="text-[var(--text-muted)]">
              Test your Twilio integration with AI agent voice response
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="to">Your Phone Number (Verified on Twilio)</Label>
              <Input
                id="to"
                value={toNumber}
                onChange={(e) => setToNumber(e.target.value)}
                placeholder="+917078716503"
                className="bg-[var(--surface)] border-[var(--border)] text-[var(--text)]"
              />
              <p className="text-sm text-[var(--text-muted)] mt-1">
                From: +17194097376 (Your Twilio number)
              </p>
            </div>
            <div>
              <Label htmlFor="agent">Select Assistant/Agent</Label>
              <select
                id="agent"
                value={selectedAgent}
                onChange={e => setSelectedAgent(e.target.value)}
                className="bg-[var(--surface)] border-[var(--border)] text-[var(--text)] w-full mt-2 p-2 rounded"
              >
                {agents.length === 0 && <option value="">No agents found</option>}
                {agents.map(agent => (
                  <option key={agent.id} value={agent.id}>{agent.name}</option>
                ))}
              </select>
            </div>

            <Button 
              onClick={handleCall} 
              disabled={loading || !toNumber}
              className="w-full bg-[var(--accent)] hover:bg-[var(--accent)]/80 text-white"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                  Making Call...
                </>
              ) : (
                <>
                  <Phone className="h-4 w-4 mr-2" />
                  Call My Number
                </>
              )}
            </Button>

            {result && (
              <Alert className={`${result.success ? 'border-green-500 bg-green-500/10' : 'border-red-500 bg-red-500/10'}`}>
                {result.success ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-red-500" />
                )}
                <AlertDescription className={result.success ? 'text-green-700' : 'text-red-700'}>
                  {result.message}
                  {result.sid && (
                    <div className="mt-2 text-sm opacity-75">
                      Call SID: {result.sid}
                    </div>
                  )}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        <Card className="bg-[var(--elevated)] border-[var(--border)]">
          <CardHeader>
            <CardTitle className="text-[var(--text)]">What Happens Next</CardTitle>
          </CardHeader>
          <CardContent className="text-[var(--text-muted)] space-y-2">
            <p>1. Call will be made from +17194097376 to your verified number</p>
            <p>2. When you answer, you'll hear your AI assistant speaking</p>
            <p>3. The assistant will ask how you're doing and wait for speech input</p>
            <p>4. Uses your ngrok webhook: https://a0edb58d10fc.ngrok-free.app</p>
            <p>5. Speech processing handled by the /process-speech endpoint</p>
          </CardContent>
        </Card>

        <Card className="bg-[var(--elevated)] border-[var(--border)]">
          <CardHeader>
            <CardTitle className="text-[var(--text)]">API Endpoints</CardTitle>
          </CardHeader>
          <CardContent className="text-[var(--text-muted)] space-y-2">
            <p><strong>Make Call:</strong> POST /api/twilio/make-call</p>
            <p><strong>Incoming Call:</strong> POST /api/twilio/incoming-call</p>
            <p><strong>Speech Processing:</strong> POST /api/twilio/process-speech</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
