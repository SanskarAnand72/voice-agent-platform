"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Phone, PhoneOff, Clock, DollarSign } from "lucide-react"
import { cn } from "@/lib/utils"

interface Call {
  id: string
  agent_id: string
  twilio_call_sid: string
  caller_phone: string
  status: string
  direction: "inbound" | "outbound"
  duration?: number
  cost?: number
  started_at: string
  ended_at?: string
}

interface CallStatusMonitorProps {
  className?: string
}

export function CallStatusMonitor({ className }: CallStatusMonitorProps) {
  const [activeCalls, setActiveCalls] = useState<Call[]>([])
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    // Create EventSource for real-time call status updates
    const eventSource = new EventSource("/api/realtime/call-status")

    eventSource.onopen = () => {
      setIsConnected(true)
    }

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data)

      if (data.type === "call_status_update") {
        const call = data.data
        setActiveCalls((prevCalls) => {
          const existingIndex = prevCalls.findIndex((c) => c.id === call.id)

          if (data.eventType === "DELETE" || call.status === "completed" || call.status === "failed") {
            // Remove completed/failed calls
            return prevCalls.filter((c) => c.id !== call.id)
          } else if (existingIndex >= 0) {
            // Update existing call
            const updated = [...prevCalls]
            updated[existingIndex] = call
            return updated
          } else if (call.status === "in-progress" || call.status === "initiated") {
            // Add new active call
            return [...prevCalls, call]
          }

          return prevCalls
        })
      }
    }

    eventSource.onerror = () => {
      setIsConnected(false)
    }

    return () => {
      eventSource.close()
      setIsConnected(false)
    }
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "in-progress":
        return "bg-green-500"
      case "initiated":
        return "bg-yellow-500"
      case "ringing":
        return "bg-blue-500"
      default:
        return "bg-gray-500"
    }
  }

  const formatDuration = (startTime: string) => {
    const start = new Date(startTime).getTime()
    const now = Date.now()
    const duration = Math.floor((now - start) / 1000)
    const minutes = Math.floor(duration / 60)
    const seconds = duration % 60
    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  }

  const handleEndCall = async (callId: string) => {
    // TODO: Implement call termination
    console.log(`End call ${callId}`)
  }

  return (
    <Card className={cn("bg-card border-border", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-card-foreground">Active Calls</CardTitle>
          <div className="flex items-center gap-2">
            <div className={cn("h-2 w-2 rounded-full", isConnected ? "bg-green-500" : "bg-red-500", "animate-pulse")} />
            <span className="text-sm text-muted-foreground">{isConnected ? "Live" : "Offline"}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activeCalls.length === 0 ? (
            <div className="text-center py-8">
              <Phone className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">No active calls</p>
            </div>
          ) : (
            activeCalls.map((call) => (
              <div key={call.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={cn("h-3 w-3 rounded-full", getStatusColor(call.status), "animate-pulse")} />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-card-foreground">{call.caller_phone}</span>
                      <Badge variant="outline" className="text-xs">
                        {call.direction}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDuration(call.started_at)}
                      </div>
                      {call.cost && (
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />${call.cost.toFixed(4)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={call.status === "in-progress" ? "default" : "secondary"}>{call.status}</Badge>
                  <Button variant="outline" size="sm" onClick={() => handleEndCall(call.id)}>
                    <PhoneOff className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
