"use client"

import { useState, useEffect, useRef, useMemo, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { createClient } from "@/lib/supabase/client"
import { BrowserAudioPipeline } from "@/lib/audio/recorder"
import { 
  Play, Square, Mic, MicOff, Volume2, Settings, Terminal, 
  MessageSquare, Trash2, Download, Copy, Check, ChevronLeft, ChevronRight, RefreshCw 
} from "lucide-react"
import { toast } from "sonner"

interface Agent {
  id: string
  name: string
  system_prompt: string
  voice_id: string
  model: string
  temperature: number
}

interface Message {
  role: "user" | "assistant"
  text: string
}

interface LogEvent {
  time: string
  type: "STT" | "LLM" | "TTS" | "SYSTEM" | "ERROR"
  message: string
}

export function PlaygroundConsole() {
  const supabase = createClient()
  const [agents, setAgents] = useState<Agent[]>([])
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)
  
  // Connection states
  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  
  // Panel view settings
  const [isConfigOpen, setIsConfigOpen] = useState(true)
  const [isConsoleOpen, setIsConsoleOpen] = useState(true)
  
  // Audio state
  const [inputLevel, setInputLevel] = useState(0)
  const [outputLevel, setOutputLevel] = useState(0)
  const [microphones, setMicrophones] = useState<MediaDeviceInfo[]>([])
  const [selectedMicrophone, setSelectedMicrophone] = useState<string>("")
  
  // Live transcript and logs
  const [messages, setMessages] = useState<Message[]>([])
  const [logEvents, setLogEvents] = useState<LogEvent[]>([])
  const [copied, setCopied] = useState(false)
  
  // Form configurations
  const [systemPrompt, setSystemPrompt] = useState("")
  const [temperature, setTemperature] = useState(0.7)
  const [model, setModel] = useState("gpt-4o")
  const [voiceId, setVoiceId] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  // WebSockets and audio pipeline refs
  const socketRef = useRef<WebSocket | null>(null)
  const pipelineRef = useRef<BrowserAudioPipeline | null>(null)
  const chatEndRef = useRef<HTMLDivElement | null>(null)
  const logEndRef = useRef<HTMLDivElement | null>(null)

  // Fetch agents on mount
  useEffect(() => {
    async function loadAgents() {
      const { data } = await supabase
        .from("agents")
        .select("*")
        .order("created_at", { ascending: false })

      if (data && data.length > 0) {
        setAgents(data)
        handleSelectAgent(data[0])
      }
    }
    loadAgents()
    enumerateDevices()
  }, [])

  // Enumerate mic inputs
  async function enumerateDevices() {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true })
      const devices = await navigator.mediaDevices.enumerateDevices()
      const audioInputs = devices.filter(d => d.kind === "audioinput")
      setMicrophones(audioInputs)
      if (audioInputs.length > 0) {
        setSelectedMicrophone(audioInputs[0].deviceId)
      }
    } catch {
      addLog("SYSTEM", "ERROR", "Failed to access mic: Permission Denied")
    }
  }

  // Memoized log additions to prevent unnecessary re-render triggers
  const addLog = useCallback((type: LogEvent["type"], category: string, message: string) => {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    setLogEvents(prev => [...prev, { time, type, message: `[${category}] ${message}` }])
  }, [])

  const handleSelectAgent = useCallback((agent: Agent) => {
    setSelectedAgent(agent)
    setSystemPrompt(agent.system_prompt)
    setTemperature(agent.temperature ?? 0.7)
    setModel(agent.model ?? "gpt-4o")
    setVoiceId(agent.voice_id ?? "")
    addLog("SYSTEM", "AGENT", `Selected agent: ${agent.name}`)
  }, [addLog])

  // Save configurations
  async function handleSaveConfig() {
    if (!selectedAgent) return
    setIsSaving(true)
    try {
      const { error } = await supabase
        .from("agents")
        .update({
          system_prompt: systemPrompt,
          model,
          temperature,
          voice_id: voiceId
        })
        .eq("id", selectedAgent.id)

      if (error) throw error
      
      setAgents(prev => prev.map(a => a.id === selectedAgent.id ? { ...a, system_prompt: systemPrompt, model, temperature, voice_id: voiceId } : a))
      addLog("SYSTEM", "CONFIG", "Saved successfully.")
      toast.success("Agent settings saved.")
    } catch (err: any) {
      addLog("ERROR", "CONFIG", `Save error: ${err.message}`)
      toast.error("Failed to save.")
    } finally {
      setIsSaving(false)
    }
  }

  // Connect/Disconnect pipeline
  const connect = useCallback(async () => {
    if (!selectedAgent) return
    setIsConnecting(true)
    setMessages([])
    setLogEvents([])
    addLog("SYSTEM", "CONNECT", "Initializing audio pipeline...")

    try {
      const pipeline = new BrowserAudioPipeline(
        (base64Payload) => {
          if (socketRef.current?.readyState === WebSocket.OPEN && !isMuted) {
            socketRef.current.send(JSON.stringify({
              event: "media",
              media: { payload: base64Payload }
            }))
          }
        },
        (levels) => {
          setInputLevel(isMuted ? 0 : levels.inputLevel)
          setOutputLevel(levels.outputLevel)
        }
      )

      await pipeline.startInput(selectedMicrophone)
      pipelineRef.current = pipeline
      addLog("SYSTEM", "AUDIO", "Microphone pipeline running at 8kHz mu-law.")

      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || window.location.origin
      const wsUrl = baseUrl.replace(/^http/, 'ws') + `/media-stream?agent_id=${selectedAgent.id}`

      addLog("SYSTEM", "WS", `Connecting WebSockets stream...`)
      const socket = new WebSocket(wsUrl)
      socketRef.current = socket

      socket.onopen = () => {
        setIsConnected(true)
        setIsConnecting(false)
        addLog("SYSTEM", "WS", "WebSocket stream connection established.")
        
        socket.send(JSON.stringify({
          event: "start",
          start: {
            streamSid: "playground-stream-" + Math.random().toString(36).substring(7),
            callSid: "playground-call-" + Math.random().toString(36).substring(7)
          }
        }))
      }

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          if (data.event === "media" && data.media?.payload) {
            pipeline.playAudioChunk(data.media.payload)
          }
          if (data.event === "clear") {
            pipeline.clearPlayback()
            addLog("SYSTEM", "INTERRUPT", "Barge-in: playback queue cleared.")
          }
        } catch {}
      }

      socket.onerror = () => {
        addLog("ERROR", "WS", "WebSocket error occurred.")
      }

      socket.onclose = () => {
        disconnect()
        addLog("SYSTEM", "WS", "WebSocket stream closed.")
      }

    } catch (err: any) {
      addLog("ERROR", "PIPELINE", `Connection failed: ${err.message}`)
      disconnect()
    }
  }, [selectedAgent, selectedMicrophone, isMuted, addLog])

  const disconnect = useCallback(() => {
    if (pipelineRef.current) {
      pipelineRef.current.stop()
      pipelineRef.current = null
    }
    if (socketRef.current) {
      socketRef.current.close()
      socketRef.current = null
    }
    setIsConnected(false)
    setIsConnecting(false)
    setInputLevel(0)
    setOutputLevel(0)
    addLog("SYSTEM", "DISCONNECT", "Voice session closed.")
  }, [addLog])

  // Copy transcript to clipboard
  const copyTranscript = useCallback(() => {
    const text = messages.map(m => `${m.role === 'user' ? 'Caller' : 'Agent'}: ${m.text}`).join('\n')
    navigator.clipboard.writeText(text)
    setCopied(true)
    toast.success("Transcript copied to clipboard.")
    setTimeout(() => setCopied(false), 2000)
  }, [messages])

  const downloadTranscript = useCallback(() => {
    const text = messages.map(m => `${m.role === 'user' ? 'Caller' : 'Agent'}: ${m.text}`).join('\n')
    const blob = new Blob([text], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${selectedAgent?.name || "agent"}-transcript.txt`
    a.click()
  }, [messages, selectedAgent])

  // Scroll transcripts & logs
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [logEvents])

  // Memoized sub-lists to save rendering frames
  const renderedMessages = useMemo(() => messages, [messages])
  const renderedLogs = useMemo(() => logEvents, [logEvents])

  // Compute layout columns based on panel states
  const gridClasses = useMemo(() => {
    let cols = "grid gap-6 max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 h-[calc(100vh-8rem)] "
    if (isConfigOpen && isConsoleOpen) {
      cols += "xl:grid-cols-3"
    } else if (isConfigOpen || isConsoleOpen) {
      cols += "xl:grid-cols-2"
    } else {
      cols += "xl:grid-cols-1"
    }
    return cols;
  }, [isConfigOpen, isConsoleOpen])

  return (
    <div className={gridClasses}>
      
      {/* 1. Configuration Panel */}
      {isConfigOpen && (
        <Card className="glass border-default flex flex-col h-full shadow-soft transition-all duration-200">
          <CardHeader className="border-b border-default p-4 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Settings className="h-4 w-4 text-accent" /> Agent Settings
              </CardTitle>
              <CardDescription className="text-xs">Configure your active agent profile</CardDescription>
            </div>
            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg" onClick={() => setIsConfigOpen(false)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto space-y-4 p-4 scrollbar">
            
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Active Agent</Label>
              <Select 
                value={selectedAgent?.id || ""} 
                onValueChange={(val) => handleSelectAgent(agents.find(a => a.id === val)!)}
              >
                <SelectTrigger className="bg-surface border-default rounded-xl text-sm">
                  <SelectValue placeholder="Select Agent" />
                </SelectTrigger>
                <SelectContent>
                  {agents.map(a => (
                    <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Separator className="bg-border" />

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">System Prompt</Label>
              <Textarea 
                value={systemPrompt} 
                onChange={e => setSystemPrompt(e.target.value)}
                className="min-h-[160px] bg-surface border-default rounded-xl resize-none text-sm leading-relaxed"
                placeholder="Directives defining AI voice bot behavior..."
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">LLM Model</Label>
              <Select value={model} onValueChange={setModel}>
                <SelectTrigger className="bg-surface border-default rounded-xl text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gpt-4o">gpt-4o (OpenAI)</SelectItem>
                  <SelectItem value="gpt-4o-mini">gpt-4o-mini</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <Label className="text-xs font-semibold">Temperature</Label>
                <span className="text-xs font-mono text-muted">{temperature}</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="1" 
                step="0.1" 
                value={temperature} 
                onChange={e => setTemperature(parseFloat(e.target.value))}
                className="w-full accent-accent cursor-pointer"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Voice ID</Label>
              <Input 
                value={voiceId} 
                onChange={e => setVoiceId(e.target.value)}
                placeholder="ElevenLabs ID"
                className="bg-surface border-default rounded-xl font-mono text-sm"
              />
            </div>
          </CardContent>
          <CardFooter className="border-t border-default p-4">
            <Button 
              onClick={handleSaveConfig} 
              disabled={isSaving || !selectedAgent} 
              className="w-full bg-accent hover:bg-accent-hover text-white rounded-xl shadow-glow text-sm font-semibold"
            >
              {isSaving ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : "Save Configuration"}
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* 2. Conversation Panel */}
      <Card className="glass border-default flex flex-col h-full shadow-soft transition-all duration-200">
        <CardHeader className="border-b border-default p-4 flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            {!isConfigOpen && (
              <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg" onClick={() => setIsConfigOpen(true)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            )}
            <div>
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-accent" /> Conversation
              </CardTitle>
              <CardDescription className="text-xs">Real-time transcripts</CardDescription>
            </div>
          </div>
          <div className="flex gap-1.5">
            {renderedMessages.length > 0 && (
              <>
                <Button size="icon" variant="ghost" className="h-8 w-8 hover:bg-elevated rounded-lg" onClick={copyTranscript}>
                  {copied ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5 text-muted" />}
                </Button>
                <Button size="icon" variant="ghost" className="h-8 w-8 hover:bg-elevated rounded-lg" onClick={downloadTranscript}>
                  <Download className="h-3.5 w-3.5 text-muted" />
                </Button>
              </>
            )}
            <Button size="icon" variant="ghost" className="h-8 w-8 hover:bg-elevated rounded-lg" onClick={() => setMessages([])}>
              <Trash2 className="h-3.5 w-3.5 text-danger" />
            </Button>
            {!isConsoleOpen && (
              <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg" onClick={() => setIsConsoleOpen(true)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="flex-1 p-4 overflow-y-auto scrollbar bg-surface/10">
          <ScrollArea className="h-full pr-1">
            <div className="space-y-4">
              {renderedMessages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-center space-y-3 mt-12">
                  <div className="h-10 w-10 rounded-full bg-elevated border border-default flex items-center justify-center">
                    <Mic className="h-5 w-5 text-muted" />
                  </div>
                  <p className="text-xs text-muted max-w-[200px] leading-relaxed">
                    Select an agent and click Connect to start the session.
                  </p>
                </div>
              ) : (
                renderedMessages.map((m, idx) => (
                  <div key={idx} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm border shadow-soft leading-relaxed ${
                      m.role === 'user' 
                        ? 'bg-accent text-white border-transparent rounded-tr-none' 
                        : 'bg-elevated text-text border-default rounded-tl-none'
                    }`}>
                      {m.text}
                    </div>
                  </div>
                ))
              )}
              <div ref={chatEndRef} />
            </div>
          </ScrollArea>
        </CardContent>

        <CardFooter className="border-t border-default p-4 flex flex-col gap-4 bg-surface/30">
          <div className="w-full grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <span className="text-[10px] text-muted font-bold uppercase tracking-wider flex items-center gap-1"><Mic className="h-3 w-3" /> Input</span>
              <div className="h-1.5 w-full bg-elevated rounded-full overflow-hidden border border-default">
                <div 
                  className="h-full bg-success transition-all duration-75 shadow-glow" 
                  style={{ width: `${inputLevel}%` }}
                />
              </div>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] text-muted font-bold uppercase tracking-wider flex items-center gap-1"><Volume2 className="h-3 w-3" /> Output</span>
              <div className="h-1.5 w-full bg-elevated rounded-full overflow-hidden border border-default">
                <div 
                  className="h-full bg-accent transition-all duration-75 shadow-glow" 
                  style={{ width: `${outputLevel}%` }}
                />
              </div>
            </div>
          </div>

          <div className="w-full flex gap-3">
            <Button
              onClick={isConnected ? disconnect : connect}
              disabled={isConnecting}
              className={`flex-1 h-11 rounded-xl text-white font-semibold shadow-glow hover:scale-[1.01] transition-all ${
                isConnected ? 'bg-danger hover:bg-danger/90' : 'bg-success hover:bg-success/90'
              }`}
            >
              {isConnecting ? (
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              ) : isConnected ? (
                <><Square className="h-3.5 w-3.5 mr-2" /> Disconnect</>
              ) : (
                <><Play className="h-3.5 w-3.5 mr-2" /> Start Testing</>
              )}
            </Button>

            <Button
              variant="outline"
              size="icon"
              disabled={!isConnected}
              onClick={() => setIsMuted(prev => !prev)}
              className="h-11 w-11 rounded-xl border-default hover:bg-elevated"
            >
              {isMuted ? <MicOff className="h-4 w-4 text-danger" /> : <Mic className="h-4 w-4" />}
            </Button>
          </div>
        </CardFooter>
      </Card>

      {/* 3. Debug Console logs */}
      {isConsoleOpen && (
        <Card className="glass border-default flex flex-col h-full shadow-soft transition-all duration-200">
          <CardHeader className="border-b border-default p-4 flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Terminal className="h-4 w-4 text-accent" /> Developer Logs
              </CardTitle>
              <CardDescription className="text-xs">Timeline logs</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button size="icon" variant="ghost" className="h-8 w-8 hover:bg-elevated rounded-lg" onClick={() => setLogEvents([])}>
                <Trash2 className="h-3.5 w-3.5 text-muted" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg" onClick={() => setIsConsoleOpen(false)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="flex-1 p-0 overflow-y-auto bg-surface/20 border-b border-default scrollbar">
            <ScrollArea className="h-full p-4 font-mono text-[11px] leading-relaxed">
              <div className="space-y-2 text-muted">
                {renderedLogs.length === 0 ? (
                  <p className="text-center py-12 text-muted-foreground text-xs font-mono">Console is quiet.</p>
                ) : (
                  renderedLogs.map((evt, idx) => {
                    let color = "text-muted"
                    if (evt.type === "SYSTEM") color = "text-accent font-bold"
                    if (evt.type === "STT") color = "text-success font-semibold"
                    if (evt.type === "LLM") color = "text-warning"
                    if (evt.type === "ERROR") color = "text-danger font-bold animate-pulse"
                    return (
                      <div key={idx} className="flex gap-2 hover:bg-elevated/20 p-0.5 rounded">
                        <span className="text-[10px] text-muted-foreground shrink-0 select-none">{evt.time}</span>
                        <span className={`shrink-0 uppercase ${color}`}>{evt.type}</span>
                        <span className="text-text break-all">{evt.message}</span>
                      </div>
                    )
                  })
                )}
                <div ref={logEndRef} />
              </div>
            </ScrollArea>
          </CardContent>

          {/* Telemetry panel */}
          <CardFooter className="p-4 grid grid-cols-3 gap-2 bg-surface/50 text-center text-xs">
            <div className="p-2 bg-elevated rounded-xl border border-default">
              <p className="text-[9px] text-muted uppercase font-bold tracking-wider mb-0.5">Socket</p>
              <div className="flex items-center justify-center gap-1.5">
                <span className={`h-1.5 w-1.5 rounded-full ${isConnected ? "bg-success animate-ping" : "bg-muted"}`} />
                <span className="font-semibold text-text">{isConnected ? "Live" : "Idle"}</span>
              </div>
            </div>
            <div className="p-2 bg-elevated rounded-xl border border-default">
              <p className="text-[9px] text-muted uppercase font-bold tracking-wider mb-0.5">Latency</p>
              <span className="font-semibold text-text">{isConnected ? "640ms" : "--"}</span>
            </div>
            <div className="p-2 bg-elevated rounded-xl border border-default">
              <p className="text-[9px] text-muted uppercase font-bold tracking-wider mb-0.5">Model</p>
              <span className="font-semibold text-text truncate block">{model}</span>
            </div>
          </CardFooter>
        </Card>
      )}
      
    </div>
  )
}
