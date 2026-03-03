"use client"

import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts"
import type { ClusterResult } from "@/lib/types"

interface ClusterScatterChartProps {
  data: { x: number; y: number; cluster: number; id: string }[]
  clusters: ClusterResult[]
}

export function ClusterScatterChart({ data, clusters }: ClusterScatterChartProps) {
  if (data.length === 0) {
    return <div className="h-[300px] flex items-center justify-center text-muted-foreground">No data to visualize</div>
  }

  return (
    <div className="h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis
            type="number"
            dataKey="x"
            name="PC1"
            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
            axisLine={{ stroke: "hsl(var(--border))" }}
          />
          <YAxis
            type="number"
            dataKey="y"
            name="PC2"
            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
            axisLine={{ stroke: "hsl(var(--border))" }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "8px",
            }}
            labelStyle={{ color: "hsl(var(--foreground))" }}
            formatter={(value: number) => value.toFixed(2)}
          />
          <Scatter name="Samples" data={data}>
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={clusters[entry.cluster]?.color || "hsl(var(--primary))"}
                fillOpacity={0.8}
              />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
      <div className="flex justify-center gap-4 mt-4">
        {clusters.map((cluster) => (
          <div key={cluster.cluster} className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cluster.color }} />
            <span className="text-xs text-muted-foreground">Cluster {cluster.cluster + 1}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
