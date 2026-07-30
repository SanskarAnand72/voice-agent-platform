'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Phone, CheckCircle, AlertCircle } from 'lucide-react'

export default function SimpleCallTest() {
  const [fromNumber, setFromNumber] = useState('+17194097376')
  const [toNumber, setToNumber] = useState('+917078716503')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string; callSid?: string } | null>(null)

  const handleSimpleCall = async () => {
    setLoading(true)
    setResult(null)

    try {
      const response = await fetch('/api/twilio/simple-call', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fromNumber,
          toNumber,
        }),
      })

      const data = await response.json()
      
      if (response.ok) {
        setResult({
          success: true,
          message: data.message,
          callSid: data.callSid
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
              Simple Call Test
            </CardTitle>
            <CardDescription className="text-[var(--text-muted)]">
              Test basic Twilio calling functionality without webhooks (works immediately)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="from">From Number (Twilio)</Label>
                <Input
                  id="from"
                  value={fromNumber}
                  onChange={(e) => setFromNumber(e.target.value)}
                  placeholder="+17194097376"
                  className="bg-[var(--surface)] border-[var(--border)] text-[var(--text)]"
                />
              </div>
              <div>
                <Label htmlFor="to">To Number (Your Phone)</Label>
                <Input
                  id="to"
                  value={toNumber}
                  onChange={(e) => setToNumber(e.target.value)}
                  placeholder="+917078716503"
                  className="bg-[var(--surface)] border-[var(--border)] text-[var(--text)]"
                />
              </div>
            </div>

            <Button 
              onClick={handleSimpleCall} 
              disabled={loading || !fromNumber || !toNumber}
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
                  Make Simple Test Call
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
                  {result.callSid && (
                    <div className="mt-2 text-sm opacity-75">
                      Call SID: {result.callSid}
                    </div>
                  )}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        <Card className="bg-[var(--elevated)] border-[var(--border)]">
          <CardHeader>
            <CardTitle className="text-[var(--text)]">What This Test Does</CardTitle>
          </CardHeader>
          <CardContent className="text-[var(--text-muted)] space-y-2">
            <p>• Uses Twilio's demo TwiML URL (no localhost needed)</p>
            <p>• Works immediately without ngrok setup</p>
            <p>• Calls your verified Indian number (+917078716503)</p>
            <p>• You'll hear: "Please leave a message after the tone"</p>
            <p>• Proves your Twilio account can call Indian numbers</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
