"use client"

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts"
import type { PredictionResult } from "@/lib/types"

interface ProductivityPieChartProps {
  predictions: PredictionResult[]
}

export function ProductivityPieChart({ predictions }: ProductivityPieChartProps) {
  const data = [
    {
      name: "High",
      value: predictions.filter((p) => p.productivityClass === "High").length,
      color: "hsl(145, 60%, 45%)",
    },
    {
      name: "Medium",
      value: predictions.filter((p) => p.productivityClass === "Medium").length,
      color: "hsl(45, 80%, 55%)",
    },
    {
      name: "Low",
      value: predictions.filter((p) => p.productivityClass === "Low").length,
      color: "hsl(0, 70%, 55%)",
    },
  ].filter((d) => d.value > 0)

  if (data.length === 0) {
    return (
      <div className="h-[300px] flex items-center justify-center text-muted-foreground">No predictions available</div>
    )
  }

  return (
    <div className="h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={2}
            dataKey="value"
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            labelLine={false}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "8px",
            }}
          />
          <Legend
            formatter={(value) => <span style={{ color: "hsl(var(--foreground))" }}>{value}</span>}
            wrapperStyle={{ paddingTop: "20px" }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
