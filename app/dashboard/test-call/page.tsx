"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Phone, CheckCircle, AlertCircle, ExternalLink, Copy } from "lucide-react"
import { toast } from "sonner"

export default function TestCallPage() {
  const [fromNumber, setFromNumber] = useState("")
  const [toNumber, setToNumber] = useState("+917078716503")
  const [testMode, setTestMode] = useState(true)
  const [loading, setLoading] = useState(false)
  const [lastResult, setLastResult] = useState<any>(null)

  const handleTestCall = async () => {
    if (!fromNumber || !toNumber) {
      toast.error("Both phone numbers are required")
      return
    }

    setLoading(true)
    try {
      const response = await fetch("/api/twilio/test-call", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from_number: fromNumber,
          to_number: toNumber,
          test_mode: testMode
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to make test call")
      }

      setLastResult(result)
      toast.success(`Call initiated! Call SID: ${result.call_sid}`)

    } catch (error) {
      console.error("Test call error:", error)
      toast.error(`Failed to make call: ${error instanceof Error ? error.message : 'Unknown error'}`)
      setLastResult({ error: error instanceof Error ? error.message : 'Unknown error' })
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success("Copied to clipboard!")
  }

  return (
    <div className="flex-1 space-y-8 p-6 sm:p-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-text tracking-tight">Test Call Functionality</h1>
        <p className="text-muted-foreground">
          Test your Twilio integration by making a call to your number
        </p>
      </div>

      <Alert className="border-yellow-200 bg-yellow-50/50">
        <AlertCircle className="h-4 w-4 text-yellow-500" />
        <AlertDescription className="text-yellow-700">
          <strong>Important:</strong> You need a verified Twilio phone number to make calls. 
          Visit <a href="https://console.twilio.com/" target="_blank" rel="noopener noreferrer" className="underline">Twilio Console</a> to purchase one.
        </AlertDescription>
      </Alert>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="bg-elevated border-default">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-text">
              <Phone className="h-5 w-5" />
              Make Test Call
            </CardTitle>
            <CardDescription>
              Call your number using a Twilio phone number
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="from">From (Twilio Number)</Label>
              <Input
                id="from"
                placeholder="+1234567890"
                value={fromNumber}
                onChange={(e) => setFromNumber(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Must be a phone number purchased from Twilio
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="to">To (Your Number)</Label>
              <Input
                id="to"
                placeholder="+917078716503"
                value={toNumber}
                onChange={(e) => setToNumber(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Your personal phone number in international format
              </p>
            </div>

            <div className="space-y-2">
              <Label>Call Type</Label>
              <div className="flex gap-2">
                <Button
                  variant={testMode ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTestMode(true)}
                >
                  Simple Test
                </Button>
                <Button
                  variant={!testMode ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTestMode(false)}
                >
                  AI Agent
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                {testMode ? "Plays a simple test message" : "Full AI agent interaction"}
              </p>
            </div>

            <Button 
              onClick={handleTestCall} 
              disabled={loading}
              className="w-full bg-accent text-white hover:bg-accent/90"
            >
              {loading ? "Calling..." : "Make Test Call"}
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-elevated border-default">
          <CardHeader>
            <CardTitle className="text-text">Quick Setup Guide</CardTitle>
            <CardDescription>
              Steps to get your test call working
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-accent text-white text-sm font-bold">1</div>
                <div>
                  <p className="font-medium text-text">Purchase Twilio Number</p>
                  <p className="text-sm text-muted-foreground">Buy a phone number from Twilio Console</p>
                  <Button variant="outline" size="sm" className="mt-2" asChild>
                    <a href="https://console.twilio.com/us1/develop/phone-numbers/manage/incoming" target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Buy Number
                    </a>
                  </Button>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-accent text-white text-sm font-bold">2</div>
                <div>
                  <p className="font-medium text-text">Enter Numbers</p>
                  <p className="text-sm text-muted-foreground">Use your Twilio number as "From" and your personal number as "To"</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-accent text-white text-sm font-bold">3</div>
                <div>
                  <p className="font-medium text-text">Test Call</p>
                  <p className="text-sm text-muted-foreground">Click "Make Test Call" and answer your phone!</p>
                </div>
              </div>
            </div>

            <div className="bg-surface rounded-lg p-3">
              <p className="text-sm font-medium text-text mb-2">Your Number (Pre-filled):</p>
              <div className="flex items-center gap-2">
                <code className="text-sm bg-elevated px-2 py-1 rounded">+917078716503</code>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard("+917078716503")}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {lastResult && (
        <Card className="bg-elevated border-default">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-text">
              {lastResult.error ? (
                <><AlertCircle className="h-5 w-5 text-red-500" /> Call Failed</>
              ) : (
                <><CheckCircle className="h-5 w-5 text-green-500" /> Call Initiated</>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {lastResult.error ? (
              <div className="text-red-600">
                <p className="font-medium">Error: {lastResult.error}</p>
                {lastResult.details && (
                  <p className="text-sm mt-1">Details: {lastResult.details}</p>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="success">Success</Badge>
                  <span className="text-text">Call SID: {lastResult.call_sid}</span>
                </div>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>From: {lastResult.from}</p>
                  <p>To: {lastResult.to}</p>
                  <p>Status: {lastResult.call_details?.status}</p>
                  <p>Direction: {lastResult.call_details?.direction}</p>
                </div>
                <p className="text-sm text-green-600 font-medium mt-2">
                  📞 Your phone should be ringing now!
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
