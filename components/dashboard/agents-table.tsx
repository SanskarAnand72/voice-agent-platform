"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { 
  Phone, Play, Pause, Edit, Trash2, 
  Search, ArrowUpDown, ChevronLeft, ChevronRight 
} from "lucide-react"
import { toast } from "sonner"

interface Agent {
  id: string
  assistantId: string
  name: string
  description: string | null
  system_prompt: string
  model: string
  voice_id: string | null
  phone_number: string | null
  status: string
  created_at: string
  temperature: number
  max_tokens: number
}

interface AgentsTableProps {
  agents: Agent[]
}

type SortField = "name" | "status" | "created_at"
type SortOrder = "asc" | "desc"

export function AgentsTable({ agents: initialAgents }: AgentsTableProps) {
  const [agents, setAgents] = useState<Agent[]>(initialAgents)
  const [searchQuery, setSearchQuery] = useState("")
  const [sortField, setSortField] = useState<SortField>("created_at")
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5

  // Filter, Sort, and Paginate Data
  const filteredAndSortedAgents = useMemo(() => {
    let result = [...agents]

    // Filtering
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        a => 
          a.name.toLowerCase().includes(query) || 
          (a.description || "").toLowerCase().includes(query) ||
          a.assistantId.toLowerCase().includes(query)
      )
    }

    // Sorting
    result.sort((a, b) => {
      if (sortField === "created_at") {
        const tA = new Date(a.created_at).getTime()
        const tB = new Date(b.created_at).getTime()
        return sortOrder === "asc" ? tA - tB : tB - tA
      }
      const valA = (a[sortField] || "") as string
      const valB = (b[sortField] || "") as string
      return sortOrder === "asc" ? valA.localeCompare(valB) : valB.localeCompare(valA)
    })

    return result
  }, [agents, searchQuery, sortField, sortOrder])

  // Pagination bounds
  const totalPages = Math.ceil(filteredAndSortedAgents.length / itemsPerPage)
  const paginatedAgents = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return filteredAndSortedAgents.slice(startIndex, startIndex + itemsPerPage)
  }, [filteredAndSortedAgents, currentPage])

  function handleSort(field: SortField) {
    if (sortField === field) {
      setSortOrder(prev => (prev === "asc" ? "desc" : "asc"))
    } else {
      setSortField(field)
      setSortOrder("asc")
    }
    setCurrentPage(1)
  }

  const handleToggleAgent = async (agentId: string, currentStatus: string) => {
    const newStatus = currentStatus === "active" ? "inactive" : "active"
    try {
      const response = await fetch(`/api/agents/${agentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) throw new Error("Failed to update agent")

      setAgents(prev => prev.map(a => a.id === agentId ? { ...a, status: newStatus } : a))
      toast.success(`Agent is now ${newStatus}`)
    } catch {
      toast.error("Failed to update agent status")
    }
  }

  const handleMakeCall = async (agentId: string) => {
    const agent = agents.find(a => a.id === agentId)
    if (!agent) return

    if (!agent.phone_number) {
      toast.error("Agent phone number not configured. Add a phone number first.")
      return
    }

    if (agent.status !== "active") {
      toast.error("Agent is inactive. Please activate the agent first.")
      return
    }

    const phoneNumber = prompt(
      `Initiate call from ${agent.name} (${agent.phone_number})\n\nEnter destination phone number (e.g. +1234567890):`
    )
    
    if (!phoneNumber) return
    if (!/^\+[1-9]\d{1,14}$/.test(phoneNumber)) {
      toast.error("Please enter a valid international phone number format (e.g., +1234567890)")
      return
    }

    try {
      toast.loading("Initiating call...", { id: "make-call" })
      const response = await fetch("/api/twilio/make-call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agent_id: agentId, to_phone: phoneNumber }),
      })

      const result = await response.json()
      if (!response.ok) throw new Error(result.error || "Failed to make call")

      toast.success(`Call triggered! SID: ${result.call_sid}`, { id: "make-call" })
    } catch (err: any) {
      toast.error(err.message || "Failed to initiate call", { id: "make-call" })
    }
  }

  const handleDelete = async (agentId: string) => {
    if (!confirm("Are you sure you want to delete this agent? This cannot be undone.")) return

    try {
      const response = await fetch(`/api/agents/${agentId}`, { method: "DELETE" })
      if (!response.ok) throw new Error("Failed to delete")

      setAgents(prev => prev.filter(a => a.id !== agentId))
      toast.success("Agent deleted successfully.")
    } catch {
      toast.error("Failed to delete agent")
    }
  }

  return (
    <Card className="bg-surface border-border">
      <CardHeader className="p-4 border-b border-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <CardTitle className="text-sm font-semibold text-text-1">AI Agent Profiles</CardTitle>
          <CardDescription className="text-text-3">Search and manage custom agent instructions.</CardDescription>
        </div>
        {/* Search controls */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-text-3" />
          <Input 
            placeholder="Search agents..." 
            value={searchQuery}
            onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            className="pl-9 bg-surface-2 border-border-2 rounded-lg text-xs"
          />
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-surface-2/40 border-b border-border">
              <TableRow>
                <TableHead onClick={() => handleSort("name")} className="cursor-pointer select-none text-text-2 font-semibold text-xs uppercase hover:text-text-1 transition-colors">
                  <span className="flex items-center gap-1.5">Name <ArrowUpDown className="h-3 w-3" /></span>
                </TableHead>
                <TableHead className="text-text-2 font-semibold text-xs uppercase">Assistant ID</TableHead>
                <TableHead className="text-text-2 font-semibold text-xs uppercase">Model</TableHead>
                <TableHead className="text-text-2 font-semibold text-xs uppercase">Phone Number</TableHead>
                <TableHead onClick={() => handleSort("status")} className="cursor-pointer select-none text-text-2 font-semibold text-xs uppercase hover:text-text-1 transition-colors">
                  <span className="flex items-center gap-1.5">Status <ArrowUpDown className="h-3 w-3" /></span>
                </TableHead>
                <TableHead className="text-right text-text-2 font-semibold text-xs uppercase">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedAgents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-text-3 text-xs">
                    No agents match your search.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedAgents.map((agent) => (
                  <TableRow key={agent.id} className="hover:bg-surface-2/20 transition-colors group">
                    <TableCell className="py-3">
                      <div>
                        <div className="font-semibold text-text-1 group-hover:text-accent transition-colors text-xs">{agent.name}</div>
                        <div className="text-[10px] text-text-3 truncate max-w-[200px] mt-0.5">
                          {agent.description || "No description provided"}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-[10px] text-text-3 font-mono">{agent.assistantId}</TableCell>
                    <TableCell className="text-xs font-medium text-text-2">{agent.model}</TableCell>
                    <TableCell className="text-xs text-text-2 font-mono">{agent.phone_number || "Not assigned"}</TableCell>
                    <TableCell>
                      <Badge variant={agent.status === "active" ? "success" : "outline"}>
                        {agent.status === "active" ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right py-2.5">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button 
                          variant="outline" 
                          size="icon-sm" 
                          onClick={() => handleToggleAgent(agent.id, agent.status)}
                          title={agent.status === "active" ? "Pause agent" : "Activate agent"}
                        >
                          {agent.status === "active" ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                        </Button>
                        <Button 
                          variant="outline" 
                          size="icon-sm" 
                          onClick={() => handleMakeCall(agent.id)}
                          title="Initiate outbound call"
                        >
                          <Phone className="h-3 w-3 text-teal-light" />
                        </Button>
                        <Link href={`/dashboard/agents/${agent.id}/edit`}>
                          <Button 
                            variant="outline" 
                            size="icon-sm" 
                            title="Configure agent settings"
                          >
                            <Edit className="h-3 w-3 text-text-2" />
                          </Button>
                        </Link>
                        <Button 
                          variant="ghost" 
                          size="icon-sm" 
                          className="text-danger hover:bg-danger/10 hover:text-danger"
                          onClick={() => handleDelete(agent.id)}
                          title="Delete agent"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-3 border-t border-border bg-surface-2/10">
            <span className="text-2xs text-text-3">
              Page {currentPage} of {totalPages}
            </span>
            <div className="flex gap-1.5">
              <Button 
                variant="outline" 
                size="sm" 
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                className="h-7 text-[10px] py-1 px-2.5"
              >
                <ChevronLeft className="h-3 w-3 mr-1" /> Previous
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                className="h-7 text-[10px] py-1 px-2.5"
              >
                Next <ChevronRight className="h-3 w-3 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
