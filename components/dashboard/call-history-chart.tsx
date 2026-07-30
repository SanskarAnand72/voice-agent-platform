"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid } from "recharts"

const data = [
  { date: "Jan", calls: 45, duration: 180 },
  { date: "Feb", calls: 52, duration: 210 },
  { date: "Mar", calls: 48, duration: 195 },
  { date: "Apr", calls: 61, duration: 240 },
  { date: "May", calls: 55, duration: 220 },
  { date: "Jun", calls: 67, duration: 285 },
]

const chartConfig = {
  calls: {
    label: "Calls",
    color: "var(--color-accent)",
  },
}

export function CallHistoryChart() {
  return (
    <Card className="bg-surface border-border overflow-hidden">
      <CardHeader className="p-5 pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm font-semibold text-text-1">Call Analytics</CardTitle>
            <CardDescription className="text-text-3 mt-1">Monthly aggregate voice session volumes</CardDescription>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono">
            <div className="flex items-center gap-1.5 text-text-2">
              <span className="inline-block size-2 rounded-full bg-accent" />
              <span>Calls</span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-5 pt-4">
        <ChartContainer config={chartConfig} className="h-[240px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
              <defs>
                <linearGradient id="callVolumeGlow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-accent)" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="var(--color-accent)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid 
                stroke="var(--color-border)" 
                strokeDasharray="4 4" 
                vertical={false} 
              />
              <XAxis
                dataKey="date"
                stroke="var(--color-text-3)"
                fontSize={11}
                fontFamily="var(--font-geist-mono)"
                tickLine={false}
                axisLine={false}
                tick={{ dy: 8, fill: "var(--color-text-3)" }}
              />
              <YAxis
                stroke="var(--color-text-3)"
                fontSize={11}
                fontFamily="var(--font-geist-mono)"
                tickLine={false}
                axisLine={false}
                tick={{ dx: -8, fill: "var(--color-text-3)" }}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent 
                    className="bg-surface-2 border-border-2 text-text-1 shadow-lg rounded-lg font-mono text-xs" 
                  />
                }
                cursor={{ stroke: "var(--color-accent-light)", strokeWidth: 1, strokeDasharray: "4 4" }}
              />
              <Area
                type="monotone"
                dataKey="calls"
                stroke="var(--color-accent)"
                fill="url(#callVolumeGlow)"
                strokeWidth={2}
                activeDot={{ r: 4, strokeWidth: 0, fill: "var(--color-accent-light)" }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
