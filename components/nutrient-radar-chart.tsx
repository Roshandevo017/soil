"use client"

import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Tooltip } from "recharts"
import type { DatasetStats } from "@/lib/types"

interface NutrientRadarChartProps {
  stats: DatasetStats | null
}

export function NutrientRadarChart({ stats }: NutrientRadarChartProps) {
  if (!stats) {
    return <div className="h-[300px] flex items-center justify-center text-muted-foreground">No data available</div>
  }

  // Normalize values to 0-100 scale for radar chart
  const maxValues: Record<string, number> = {
    nitrogen: 500,
    phosphorus: 100,
    potassium: 500,
    ph: 14,
    organicCarbon: 2,
    sulphur: 50,
  }

  const data = Object.entries(stats.summary)
    .filter(([key]) => ["nitrogen", "phosphorus", "potassium", "ph", "organicCarbon", "sulphur"].includes(key))
    .map(([key, value]) => ({
      nutrient: key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, " $1"),
      value: Math.min(100, (value.mean / (maxValues[key] || 100)) * 100),
      actual: value.mean,
    }))

  return (
    <div className="h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
          <PolarGrid stroke="hsl(var(--border))" />
          <PolarAngleAxis dataKey="nutrient" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
          <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} />
          <Radar
            name="Average"
            dataKey="value"
            stroke="hsl(var(--primary))"
            fill="hsl(var(--primary))"
            fillOpacity={0.4}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "8px",
            }}
            formatter={(value: number, _name: string, props: any) => [
              props.payload?.actual ? props.payload.actual.toFixed(2) : value.toFixed(2),
              "Average",
            ]}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  )
}
