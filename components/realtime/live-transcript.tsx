"use client"

import { useEffect, useState, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Bot, User, Activity } from "lucide-react"
import { cn } from "@/lib/utils"

interface CallLog {
  id: string
  type: "user_speech" | "ai_response" | "system_event"
  content: string
  timestamp_ms: number
  confidence?: number
  created_at: string
}

interface LiveTranscriptProps {
  callId: string
  className?: string
}

export function LiveTranscript({ callId, className }: LiveTranscriptProps) {
  const [logs, setLogs] = useState<CallLog[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!callId) return

    // Create EventSource for real-time updates
    const eventSource = new EventSource(`/api/realtime/call-logs?call_id=${callId}`)

    eventSource.onopen = () => {
      setIsConnected(true)
    }

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data)

      if (data.type === "new_log") {
        setLogs((prevLogs) => [...prevLogs, data.data])
        // Auto-scroll to bottom
        setTimeout(() => {
          if (scrollAreaRef.current) {
            scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
          }
        }, 100)
      }
    }

    eventSource.onerror = () => {
      setIsConnected(false)
    }

    return () => {
      eventSource.close()
      setIsConnected(false)
    }
  }, [callId])

  const formatTimestamp = (timestampMs: number) => {
    const seconds = Math.floor(timestampMs / 1000)
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
  }

  const getLogIcon = (type: string) => {
    switch (type) {
      case "user_speech":
        return <User className="h-4 w-4" />
      case "ai_response":
        return <Bot className="h-4 w-4" />
      case "system_event":
        return <Activity className="h-4 w-4" />
      default:
        return <Activity className="h-4 w-4" />
    }
  }

  const getLogColor = (type: string) => {
    switch (type) {
      case "user_speech":
        return "text-blue-600"
      case "ai_response":
        return "text-green-600"
      case "system_event":
        return "text-gray-600"
      default:
        return "text-gray-600"
    }
  }

  return (
    <Card className={cn("bg-card border-border", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-card-foreground">Live Transcript</CardTitle>
          <div className="flex items-center gap-2">
            <div className={cn("h-2 w-2 rounded-full", isConnected ? "bg-green-500" : "bg-red-500", "animate-pulse")} />
            <span className="text-sm text-muted-foreground">{isConnected ? "Connected" : "Disconnected"}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] w-full" ref={scrollAreaRef}>
          <div className="space-y-4">
            {logs.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Waiting for call activity...</p>
              </div>
            ) : (
              logs.map((log, index) => (
                <div key={log.id || index} className="flex items-start gap-3">
                  <div className={cn("flex-shrink-0 mt-1", getLogColor(log.type))}>{getLogIcon(log.type)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-xs">
                        {log.type.replace("_", " ")}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{formatTimestamp(log.timestamp_ms)}</span>
                      {log.confidence && (
                        <span className="text-xs text-muted-foreground">
                          {Math.round(log.confidence * 100)}% confidence
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-card-foreground break-words">{log.content}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
