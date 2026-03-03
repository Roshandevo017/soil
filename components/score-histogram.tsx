"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts"
import type { PredictionResult } from "@/lib/types"

interface ScoreHistogramProps {
  predictions: PredictionResult[]
}

export function ScoreHistogram({ predictions }: ScoreHistogramProps) {
  // Create histogram bins
  const bins = [
    { range: "0-20", min: 0, max: 20, count: 0, color: "hsl(0, 70%, 50%)" },
    { range: "21-40", min: 21, max: 40, count: 0, color: "hsl(20, 70%, 50%)" },
    { range: "41-60", min: 41, max: 60, count: 0, color: "hsl(45, 80%, 50%)" },
    { range: "61-80", min: 61, max: 80, count: 0, color: "hsl(100, 60%, 45%)" },
    { range: "81-100", min: 81, max: 100, count: 0, color: "hsl(145, 60%, 45%)" },
  ]

  predictions.forEach((p) => {
    const bin = bins.find((b) => p.productivityScore >= b.min && p.productivityScore <= b.max)
    if (bin) bin.count++
  })

  if (predictions.length === 0) {
    return <div className="h-[300px] flex items-center justify-center text-muted-foreground">No predictions yet</div>
  }

  return (
    <div className="h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={bins} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
          <XAxis
            dataKey="range"
            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
            axisLine={{ stroke: "hsl(var(--border))" }}
          />
          <YAxis
            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
            axisLine={{ stroke: "hsl(var(--border))" }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "8px",
            }}
            formatter={(value: number) => [`${value} samples`, "Count"]}
          />
          <Bar dataKey="count" radius={[4, 4, 0, 0]}>
            {bins.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
