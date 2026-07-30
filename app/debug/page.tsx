"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface HealthCheckResponse {
  timestamp: string
  environment: {
    nodeEnv: string
    hasSupabaseUrl: boolean
    hasSupabaseKey: boolean
    supabaseUrlPrefix: string
  }
  supabaseConnection: {
    status: string
    error: string | null
  }
}

export default function DebugPage() {
  const [health, setHealth] = useState<HealthCheckResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const response = await fetch("/api/health")
        if (!response.ok) {
          throw new Error(`Health check returned ${response.status}`)
        }
        const data = await response.json()
        setHealth(data)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error")
        setHealth(null)
      } finally {
        setLoading(false)
      }
    }

    checkHealth()
  }, [])

  return (
    <div className="min-h-screen bg-bg p-6 md:p-10">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-text">Authentication Debug Dashboard</h1>
          <p className="text-muted">Check Supabase connectivity and environment configuration</p>
        </div>

        {loading && (
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted">Checking Supabase connection...</p>
            </CardContent>
          </Card>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertDescription>
              <strong>Health Check Error:</strong> {error}
            </AlertDescription>
          </Alert>
        )}

        {health && (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Supabase Connection Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Status</span>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-semibold ${
                        health.supabaseConnection.status === "error"
                          ? "bg-red-100 text-red-800"
                          : health.supabaseConnection.status === "authenticated"
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {health.supabaseConnection.status.charAt(0).toUpperCase() +
                        health.supabaseConnection.status.slice(1)}
                    </span>
                  </div>

                  {health.supabaseConnection.error && (
                    <Alert variant="destructive">
                      <AlertDescription>{health.supabaseConnection.error}</AlertDescription>
                    </Alert>
                  )}

                  <div className="border-t pt-4">
                    <p className="text-sm text-muted">Last checked: {new Date(health.timestamp).toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Environment Configuration</CardTitle>
                <CardDescription>Client-side detected configuration (from .env.local)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-2 bg-bg rounded">
                    <span className="font-mono text-sm">NEXT_PUBLIC_SUPABASE_URL</span>
                    <span
                      className={`px-2 py-1 rounded text-xs font-semibold ${health.environment.hasSupabaseUrl ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
                    >
                      {health.environment.hasSupabaseUrl ? "✓ SET" : "✗ MISSING"}
                    </span>
                  </div>
                  {health.environment.hasSupabaseUrl && (
                    <p className="text-xs text-muted font-mono ml-2">{health.environment.supabaseUrlPrefix}...</p>
                  )}

                  <div className="flex items-center justify-between p-2 bg-bg rounded">
                    <span className="font-mono text-sm">NEXT_PUBLIC_SUPABASE_ANON_KEY</span>
                    <span
                      className={`px-2 py-1 rounded text-xs font-semibold ${health.environment.hasSupabaseKey ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
                    >
                      {health.environment.hasSupabaseKey ? "✓ SET" : "✗ MISSING"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2 bg-bg rounded">
                    <span className="font-mono text-sm">NODE_ENV</span>
                    <span className="text-sm">{health.environment.nodeEnv || "development"}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Troubleshooting Steps</CardTitle>
              </CardHeader>
              <CardContent>
                <ol className="space-y-3 list-decimal list-inside text-sm">
                  <li>
                    <strong>If URL is MISSING:</strong> Add{" "}
                    <code className="bg-bg px-2 py-1 rounded font-mono">NEXT_PUBLIC_SUPABASE_URL</code> to{" "}
                    <code className="bg-bg px-2 py-1 rounded font-mono">.env.local</code>
                  </li>
                  <li>
                    <strong>If KEY is MISSING:</strong> Add{" "}
                    <code className="bg-bg px-2 py-1 rounded font-mono">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> to{" "}
                    <code className="bg-bg px-2 py-1 rounded font-mono">.env.local</code>
                  </li>
                  <li>
                    <strong>If Status is Error:</strong> Check browser console (F12) for detailed error messages
                  </li>
                  <li>
                    <strong>After changes:</strong> Restart the dev server (Ctrl+C and{" "}
                    <code className="bg-bg px-2 py-1 rounded font-mono">npm run dev</code>)
                  </li>
                  <li>
                    <strong>Verify credentials:</strong> Go to your Supabase dashboard Settings → API to confirm
                    credentials are correct
                  </li>
                </ol>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  )
}
