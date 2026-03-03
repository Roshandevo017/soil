"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Database, Layers, Target, TrendingUp } from "lucide-react"
import type { DatasetStats, ClusterResult, PredictionResult } from "@/lib/types"

interface StatsCardsProps {
  stats: DatasetStats | null
  clusters: ClusterResult[]
  predictions: PredictionResult[]
}

export function StatsCards({ stats, clusters, predictions }: StatsCardsProps) {
  const cards = [
    {
      title: "Total Samples",
      value: stats?.totalSamples ?? 0,
      icon: Database,
      change: stats ? `${stats.features.length} features` : "No data",
    },
    {
      title: "Clusters",
      value: clusters.length,
      icon: Layers,
      change: clusters.length > 0 ? "K-Means applied" : "Not clustered",
    },
    {
      title: "Predictions",
      value: predictions.length,
      icon: Target,
      change:
        predictions.length > 0
          ? `${predictions.filter((p) => p.productivityClass === "High").length} High`
          : "Not predicted",
    },
    {
      title: "Avg. Score",
      value:
        predictions.length > 0
          ? (predictions.reduce((sum, p) => sum + p.productivityScore, 0) / predictions.length).toFixed(1)
          : "—",
      icon: TrendingUp,
      change:
        predictions.length > 0
          ? `${((predictions.reduce((sum, p) => sum + p.confidence, 0) / predictions.length) * 100).toFixed(0)}% confidence`
          : "No predictions",
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <Card key={card.title} className="bg-card border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{card.title}</p>
                <p className="text-2xl font-bold text-foreground mt-1">{card.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{card.change}</p>
              </div>
              <div className="p-3 bg-primary/10 rounded-lg">
                <card.icon className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
