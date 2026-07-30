"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Line, LineChart, ResponsiveContainer, XAxis, YAxis } from "recharts"

interface MetricData {
  timestamp: string
  activeCalls: number
  callsPerMinute: number
  avgResponseTime: number
}

interface LiveMetricsProps {
  className?: string
}

const chartConfig = {
  activeCalls: {
    label: "Active Calls",
    color: "hsl(var(--chart-1))",
  },
  callsPerMinute: {
    label: "Calls/Min",
    color: "hsl(var(--chart-2))",
  },
}

export function LiveMetrics({ className }: LiveMetricsProps) {
  const [metrics, setMetrics] = useState<MetricData[]>([])
  const [currentMetrics, setCurrentMetrics] = useState({
    activeCalls: 0,
    totalCallsToday: 0,
    avgResponseTime: 0,
    successRate: 0,
  })

  useEffect(() => {
    // Simulate real-time metrics updates
    const interval = setInterval(() => {
      const now = new Date()
      const timestamp = now.toLocaleTimeString("en-US", {
        hour12: false,
        hour: "2-digit",
        minute: "2-digit",
      })

      const newMetric: MetricData = {
        timestamp,
        activeCalls: Math.floor(Math.random() * 10),
        callsPerMinute: Math.floor(Math.random() * 5),
        avgResponseTime: Math.random() * 2 + 0.5,
      }

      setMetrics((prev) => {
        const updated = [...prev, newMetric]
        // Keep only last 20 data points
        return updated.slice(-20)
      })

      // Update current metrics
      setCurrentMetrics({
        activeCalls: newMetric.activeCalls,
        totalCallsToday: Math.floor(Math.random() * 100) + 50,
        avgResponseTime: newMetric.avgResponseTime,
        successRate: Math.floor(Math.random() * 20) + 80,
      })
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className={className}>
      {/* Current Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <Card className="bg-card border-border">
          <CardContent className="p-3 sm:p-4">
            <div className="text-xl sm:text-2xl font-bold text-card-foreground">{currentMetrics.activeCalls}</div>
            <p className="text-xs text-muted-foreground">Active Calls</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-3 sm:p-4">
            <div className="text-xl sm:text-2xl font-bold text-card-foreground">{currentMetrics.totalCallsToday}</div>
            <p className="text-xs text-muted-foreground">Calls Today</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-3 sm:p-4">
            <div className="text-xl sm:text-2xl font-bold text-card-foreground">
              {currentMetrics.avgResponseTime.toFixed(1)}s
            </div>
            <p className="text-xs text-muted-foreground">Avg Response</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-3 sm:p-4">
            <div className="text-xl sm:text-2xl font-bold text-card-foreground">{currentMetrics.successRate}%</div>
            <p className="text-xs text-muted-foreground">Success Rate</p>
          </CardContent>
        </Card>
      </div>

      {/* Live Chart */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-4">
          <CardTitle className="text-card-foreground">Live Activity</CardTitle>
        </CardHeader>
        <CardContent className="pb-6">
          <ChartContainer config={chartConfig} className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={metrics} margin={{ top: 15, right: 25, left: 15, bottom: 15 }}>
                <XAxis
                  dataKey="timestamp"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tick={{ dy: 10 }}
                  interval="preserveStartEnd"
                />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `${value}`}
                  tick={{ dx: -10 }}
                  domain={[0, "dataMax + 2"]}
                />
                <ChartTooltip
                  content={<ChartTooltipContent />}
                  cursor={{ strokeDasharray: "3 3" }}
                  allowEscapeViewBox={{ x: false, y: false }}
                />
                <Line
                  type="monotone"
                  dataKey="activeCalls"
                  stroke="hsl(var(--chart-1))"
                  strokeWidth={3}
                  dot={{ r: 4, strokeWidth: 2 }}
                  activeDot={{ r: 6, strokeWidth: 2 }}
                />
                <Line
                  type="monotone"
                  dataKey="callsPerMinute"
                  stroke="hsl(var(--chart-2))"
                  strokeWidth={3}
                  strokeDasharray="5 5"
                  dot={{ r: 4, strokeWidth: 2 }}
                  activeDot={{ r: 6, strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  )
}
