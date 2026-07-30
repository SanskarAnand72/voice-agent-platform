import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Bot, Phone, Clock, TrendingUp } from "lucide-react"

interface StatsCardsProps {
  stats?: {
    totalAgents: number
    totalCalls: number
    avgCallDuration: number
    successRate: number
  }
  isLoading?: boolean
}

export function StatsCards({ stats, isLoading = false }: StatsCardsProps) {
  const cards = [
    {
      title: "Active Agents",
      value: stats ? stats.totalAgents.toString() : "0",
      icon: Bot,
      description: "Ready for calls",
      color: "text-accent",
      bgColor: "bg-accent/10 border-accent/20",
    },
    {
      title: "Total Calls",
      value: stats ? stats.totalCalls.toLocaleString() : "0",
      icon: Phone,
      description: "All-time sessions",
      color: "text-teal-light",
      bgColor: "bg-teal/10 border-teal/20",
    },
    {
      title: "Average Duration",
      value: stats ? `${Math.round(stats.avgCallDuration / 60)}m ${Math.round(stats.avgCallDuration % 60)}s` : "0s",
      icon: Clock,
      description: "Talk-time average",
      color: "text-success",
      bgColor: "bg-success/10 border-success/20",
    },
    {
      title: "Success Rate",
      value: stats ? `${stats.successRate}%` : "0%",
      icon: TrendingUp,
      description: "Completed correctly",
      color: "text-warning",
      bgColor: "bg-warning/10 border-warning/20",
    },
  ]

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="skeleton h-[110px] w-full" />
        ))}
      </div>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Card 
          key={card.title} 
          className="relative overflow-hidden bg-surface border-border hover:border-border-2 transition-all duration-200"
        >
          {/* Top subtle glow strip */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-accent/40 via-teal-light/40 to-transparent" />
          
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-2">
            <CardTitle className="text-xs font-semibold text-text-2 uppercase tracking-wider">{card.title}</CardTitle>
            <div className={`p-1.5 rounded-lg border ${card.bgColor}`}>
              <card.icon className={`h-4 w-4 ${card.color}`} />
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold text-text-1 tabular-nums tracking-tight">
              {card.value}
            </div>
            <p className="text-xs text-text-3 mt-1 flex items-center gap-1.5">
              <span className="inline-block size-1.5 rounded-full bg-success animate-pulse" />
              {card.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
