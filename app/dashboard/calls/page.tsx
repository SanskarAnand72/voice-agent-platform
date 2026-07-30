"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Phone, Search, Download, Play, PhoneIncoming, PhoneOutgoing, Clock, DollarSign, ChevronLeft, ChevronRight, RefreshCw, AlertCircle } from "lucide-react"
import { format } from "date-fns"

interface Call {
  id: string
  agent_id: string | null
  caller_phone: string
  direction: "inbound" | "outbound"
  status: "completed" | "failed" | "busy" | "no-answer" | "in-progress" | "initiated"
  duration?: number
  cost?: number
  created_at: string
  ended_at: string | null
  twilio_call_sid: string
  agents?: { name: string; description: string }
  agent_name?: string
  phone_number?: string
}

const STATUS_STYLES: Record<string, string> = {
  completed: "bg-success/10 text-success border-success/20",
  failed: "bg-danger/10 text-danger border-danger/20",
  busy: "bg-warning/10 text-warning border-warning/20",
  "no-answer": "bg-border text-muted border-border",
  "in-progress": "bg-accent/10 text-accent border-accent/20",
  initiated: "bg-accent-2/10 text-accent-2 border-accent-2/20",
}

function formatDuration(seconds: number) {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, "0")}`
}

function formatCost(cost: number) {
  return `$${cost.toFixed(4)}`
}

const ITEMS_PER_PAGE = 10

export default function CallHistoryPage() {
  const [calls, setCalls] = useState<Call[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [directionFilter, setDirectionFilter] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    fetchCalls()
  }, [])

  const fetchCalls = async () => {
    try {
      setError(null)
      setLoading(true)
      const response = await fetch("/api/calls")
      if (response.ok) {
        const data = await response.json()
        setCalls(Array.isArray(data) ? data : data?.calls || [])
      } else {
        setError(`Failed to fetch calls (${response.status})`)
        setCalls([])
      }
    } catch {
      setError("Failed to connect to the server")
      setCalls([])
    } finally {
      setLoading(false)
    }
  }

  const safeCalls = Array.isArray(calls) ? calls : []

  const filteredCalls = useMemo(() => {
    return safeCalls.filter((call) => {
      const phone = call.caller_phone || call.phone_number || ""
      const agentName = call.agents?.name || call.agent_name || ""
      const matchesSearch =
        phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
        agentName.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStatus = statusFilter === "all" || call.status === statusFilter
      const matchesDirection = directionFilter === "all" || call.direction === directionFilter
      return matchesSearch && matchesStatus && matchesDirection
    })
  }, [safeCalls, searchTerm, statusFilter, directionFilter])

  const totalPages = Math.ceil(filteredCalls.length / ITEMS_PER_PAGE)
  const paginatedCalls = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE
    return filteredCalls.slice(start, start + ITEMS_PER_PAGE)
  }, [filteredCalls, currentPage])

  // Stats derived from all calls
  const totalDuration = safeCalls.reduce((s, c) => s + (c.duration || 0), 0)
  const totalCost = safeCalls.reduce((s, c) => s + (c.cost || 0), 0)
  const completedCount = safeCalls.filter(c => c.status === "completed").length

  if (loading) {
    return (
      <div className="flex-1 space-y-8 p-6 sm:p-8 max-w-7xl">
        <div className="space-y-2 animate-pulse-slow">
          <div className="h-9 w-40 bg-border rounded" />
          <div className="h-4 w-64 bg-border rounded" />
        </div>
        <div className="grid gap-6 md:grid-cols-4 animate-pulse-slow">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-elevated rounded-2xl border border-default" />
          ))}
        </div>
        <div className="h-96 bg-elevated rounded-2xl border border-default animate-pulse-slow" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center space-y-4">
          <AlertCircle className="h-12 w-12 text-danger mx-auto" />
          <h2 className="text-lg font-bold text-text">Failed to load calls</h2>
          <p className="text-sm text-muted">{error}</p>
          <Button onClick={fetchCalls} className="bg-accent hover:bg-accent-hover text-white rounded-xl">
            <RefreshCw className="h-4 w-4 mr-2" /> Retry
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-8 p-6 sm:p-8 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text tracking-tight">Call History</h1>
          <p className="text-sm text-muted">Review all inbound and outbound AI voice sessions.</p>
        </div>
        <Button variant="outline" className="border-default rounded-xl text-sm">
          <Download className="h-4 w-4 mr-2" /> Export CSV
        </Button>
      </div>

      {/* KPI Stats */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total Calls", value: safeCalls.length, icon: Phone, color: "text-accent" },
          { label: "Completed", value: completedCount, icon: PhoneIncoming, color: "text-success" },
          { label: "Total Talk Time", value: formatDuration(totalDuration), icon: Clock, color: "text-accent-2" },
          { label: "Total Cost", value: formatCost(totalCost), icon: DollarSign, color: "text-warning" },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label} className="bg-elevated border-default hover-card-lift shadow-soft">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-bold text-muted uppercase tracking-wider">{label}</CardTitle>
              <Icon className={`h-4 w-4 ${color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-text tabular-nums tracking-tight">{value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Table Card with filters integrated in header */}
      <Card className="bg-elevated border-default shadow-soft">
        <CardHeader className="border-b border-default p-4 flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex-1">
            <CardTitle className="text-lg font-bold text-text">Recent Calls</CardTitle>
            <CardDescription>
              Showing {filteredCalls.length} of {safeCalls.length} calls
            </CardDescription>
          </div>
          <div className="flex gap-3 flex-wrap">
            {/* Search */}
            <div className="relative w-full md:w-56">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted" />
              <Input
                placeholder="Search phone or agent..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1) }}
                className="pl-9 bg-surface border-default rounded-xl text-sm h-9"
              />
            </div>
            {/* Status filter */}
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setCurrentPage(1) }}>
              <SelectTrigger className="w-36 bg-surface border-default rounded-xl text-sm h-9">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="busy">Busy</SelectItem>
                <SelectItem value="no-answer">No Answer</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
              </SelectContent>
            </Select>
            {/* Direction filter */}
            <Select value={directionFilter} onValueChange={(v) => { setDirectionFilter(v); setCurrentPage(1) }}>
              <SelectTrigger className="w-32 bg-surface border-default rounded-xl text-sm h-9">
                <SelectValue placeholder="Direction" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Directions</SelectItem>
                <SelectItem value="inbound">Inbound</SelectItem>
                <SelectItem value="outbound">Outbound</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-surface/50 border-b border-default">
                <TableRow>
                  <TableHead className="text-muted font-bold text-xs uppercase">Phone</TableHead>
                  <TableHead className="text-muted font-bold text-xs uppercase">Agent</TableHead>
                  <TableHead className="text-muted font-bold text-xs uppercase">Direction</TableHead>
                  <TableHead className="text-muted font-bold text-xs uppercase">Status</TableHead>
                  <TableHead className="text-muted font-bold text-xs uppercase">Duration</TableHead>
                  <TableHead className="text-muted font-bold text-xs uppercase">Cost</TableHead>
                  <TableHead className="text-muted font-bold text-xs uppercase">Date</TableHead>
                  <TableHead className="text-right text-muted font-bold text-xs uppercase">Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedCalls.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-16">
                      <div className="flex flex-col items-center gap-3">
                        <Phone className="h-8 w-8 text-muted opacity-50" />
                        <p className="text-sm text-muted">No calls match your filter criteria.</p>
                        {(searchTerm || statusFilter !== "all" || directionFilter !== "all") && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs text-accent"
                            onClick={() => { setSearchTerm(""); setStatusFilter("all"); setDirectionFilter("all") }}
                          >
                            Clear filters
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedCalls.map((call) => (
                    <TableRow key={call.id} className="hover:bg-surface/30 transition-colors group">
                      <TableCell className="font-mono text-sm text-text">
                        {call.caller_phone || call.phone_number || "—"}
                      </TableCell>
                      <TableCell className="text-sm text-muted group-hover:text-text transition-colors">
                        {call.agents?.name || call.agent_name || "Unknown"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-xs text-muted">
                          {call.direction === "inbound"
                            ? <PhoneIncoming className="h-3.5 w-3.5 text-accent-2" />
                            : <PhoneOutgoing className="h-3.5 w-3.5 text-accent" />
                          }
                          <span className="capitalize">{call.direction}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`text-[10px] rounded-full px-2 py-0.5 font-semibold border ${STATUS_STYLES[call.status] || STATUS_STYLES["initiated"]}`}
                        >
                          {call.status.replace("-", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-text tabular-nums">
                        {call.duration ? formatDuration(call.duration) : "—"}
                      </TableCell>
                      <TableCell className="text-sm text-text tabular-nums">
                        {call.cost ? formatCost(call.cost) : "—"}
                      </TableCell>
                      <TableCell className="text-xs text-muted tabular-nums">
                        {format(new Date(call.created_at), "MMM dd, HH:mm")}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" className="h-7 text-xs rounded-lg text-muted hover:text-text">
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between p-4 border-t border-default bg-surface/20">
              <span className="text-xs text-muted">
                Page {currentPage} of {totalPages} · {filteredCalls.length} results
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => p - 1)}
                  className="h-8 rounded-lg text-xs border-default"
                >
                  <ChevronLeft className="h-3.5 w-3.5 mr-1" /> Prev
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(p => p + 1)}
                  className="h-8 rounded-lg text-xs border-default"
                >
                  Next <ChevronRight className="h-3.5 w-3.5 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
