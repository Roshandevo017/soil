"use client"

import type { SoilSample } from "@/lib/types"

interface FeatureCorrelationHeatmapProps {
  data: SoilSample[]
}

export function FeatureCorrelationHeatmap({ data }: FeatureCorrelationHeatmapProps) {
  if (data.length === 0) {
    return <div className="h-[300px] flex items-center justify-center text-muted-foreground">No data available</div>
  }

  const features: (keyof SoilSample)[] = ["nitrogen", "phosphorus", "potassium", "ph", "organicCarbon", "soilMoisture"]
  const labels = ["N", "P", "K", "pH", "OC", "SM"]

  // Calculate correlation matrix
  const calculateCorrelation = (x: number[], y: number[]): number => {
    const n = x.length
    const sumX = x.reduce((a, b) => a + b, 0)
    const sumY = y.reduce((a, b) => a + b, 0)
    const sumXY = x.reduce((total, xi, i) => total + xi * y[i], 0)
    const sumX2 = x.reduce((total, xi) => total + xi * xi, 0)
    const sumY2 = y.reduce((total, yi) => total + yi * yi, 0)

    const numerator = n * sumXY - sumX * sumY
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY))

    return denominator === 0 ? 0 : numerator / denominator
  }

  const correlationMatrix: number[][] = features.map((f1) =>
    features.map((f2) => {
      const x = data.map((d) => d[f1] as number)
      const y = data.map((d) => d[f2] as number)
      return calculateCorrelation(x, y)
    }),
  )

  const getColor = (value: number): string => {
    if (value >= 0.7) return "bg-primary"
    if (value >= 0.4) return "bg-primary/70"
    if (value >= 0.1) return "bg-primary/40"
    if (value >= -0.1) return "bg-muted"
    if (value >= -0.4) return "bg-destructive/40"
    if (value >= -0.7) return "bg-destructive/70"
    return "bg-destructive"
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <div className="inline-block min-w-full">
          <div className="flex">
            <div className="w-12" />
            {labels.map((label) => (
              <div key={label} className="w-12 text-center text-xs text-muted-foreground font-medium">
                {label}
              </div>
            ))}
          </div>
          {correlationMatrix.map((row, i) => (
            <div key={i} className="flex items-center">
              <div className="w-12 text-xs text-muted-foreground font-medium">{labels[i]}</div>
              {row.map((value, j) => (
                <div
                  key={j}
                  className={`w-12 h-10 flex items-center justify-center text-xs font-mono ${getColor(value)} rounded m-0.5`}
                  title={`${labels[i]} vs ${labels[j]}: ${value.toFixed(2)}`}
                >
                  <span className={value > 0.5 || value < -0.5 ? "text-primary-foreground" : "text-foreground"}>
                    {value.toFixed(1)}
                  </span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
      <div className="flex items-center justify-center gap-4 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-destructive rounded" />
          <span className="text-muted-foreground">Negative</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-muted rounded" />
          <span className="text-muted-foreground">Neutral</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-primary rounded" />
          <span className="text-muted-foreground">Positive</span>
        </div>
      </div>
    </div>
  )
}
