"use client"

import { useState, useEffect } from "react"
import { SidebarNav } from "@/components/sidebar-nav"
import { StatsCards } from "@/components/stats-cards"
import { DataPreview } from "@/components/data-preview"
import { ProductivityPieChart } from "@/components/productivity-pie-chart"
import { NutrientRadarChart } from "@/components/nutrient-radar-chart"
import { ScoreHistogram } from "@/components/score-histogram"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowRight, Upload, LineChart, Layers, FileText, MessageSquare, Sparkles } from "lucide-react"
import Link from "next/link"
import { soilDataStore } from "@/lib/soil-data-store"
import type { SoilSample, DatasetStats, ClusterResult, PredictionResult } from "@/lib/types"

export default function DashboardPage() {
  const [data, setData] = useState<SoilSample[]>([])
  const [stats, setStats] = useState<DatasetStats | null>(null)
  const [clusters, setClusters] = useState<ClusterResult[]>([])
  const [predictions, setPredictions] = useState<PredictionResult[]>([])

  useEffect(() => {
    setData(soilDataStore.getData())
    setStats(soilDataStore.getStats())
    setClusters(soilDataStore.getClusters())
    setPredictions(soilDataStore.getPredictions())
  }, [])

  const quickActions = [
    { href: "/upload", label: "Upload Data", icon: Upload, description: "Import your soil dataset", tone: "bg-primary/15 text-primary border-primary/30" },
    { href: "/prediction", label: "Run Prediction", icon: LineChart, description: "Predict soil productivity", tone: "bg-chart-2/15 text-chart-2 border-chart-2/30" },
    { href: "/clustering", label: "View Clusters", icon: Layers, description: "Analyze soil groupings", tone: "bg-chart-3/15 text-chart-3 border-chart-3/30" },
    { href: "/reports", label: "Generate Report", icon: FileText, description: "Export PDF reports", tone: "bg-chart-4/15 text-chart-4 border-chart-4/30" },
    { href: "/chatbot", label: "Ask AI", icon: MessageSquare, description: "Get soil health advice", tone: "bg-chart-5/15 text-chart-5 border-chart-5/30" },
  ]

  return (
    <div className="flex h-screen">
      <SidebarNav />
      <main className="flex-1 overflow-auto">
        <div className="p-6 space-y-6">
          <Card className="relative overflow-hidden border-border bg-gradient-to-br from-card via-card to-primary/10">
            <div className="absolute -top-16 -right-12 h-48 w-48 rounded-full bg-primary/15 blur-3xl" />
            <div className="absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-chart-2/10 blur-3xl" />
            <CardContent className="relative p-6 md:p-8">
              <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
                <div className="space-y-3">
                  <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-sm text-primary">
                    <Sparkles className="h-4 w-4" />
                    SoilPredict Intelligence
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">Soil Productivity Dashboard</h1>
                    <p className="mt-2 text-muted-foreground">Monitor soil quality, run predictions, and generate professional reports from one workspace.</p>
                  </div>
                  <div className="flex flex-wrap gap-2 text-sm">
                    <span className="rounded-md border border-border/70 bg-background/70 px-3 py-1 text-foreground">Samples: {data.length}</span>
                    <span className="rounded-md border border-border/70 bg-background/70 px-3 py-1 text-foreground">Predictions: {predictions.length}</span>
                    <span className="rounded-md border border-border/70 bg-background/70 px-3 py-1 text-foreground">Clusters: {clusters.length}</span>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Link href="/upload">
                    <Button size="lg">
                      <Upload className="mr-2 h-4 w-4" />
                      Start With Upload
                    </Button>
                  </Link>
                  <Link href="/prediction">
                    <Button variant="outline" size="lg">
                      Run Prediction
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>

          <StatsCards stats={stats} clusters={clusters} predictions={predictions} />

          {predictions.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="bg-card border-border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Productivity Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <ProductivityPieChart predictions={predictions} />
                </CardContent>
              </Card>

              <Card className="bg-card border-border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Score Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScoreHistogram predictions={predictions} />
                </CardContent>
              </Card>

              <Card className="bg-card border-border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Nutrient Profile</CardTitle>
                </CardHeader>
                <CardContent>
                  <NutrientRadarChart stats={stats} />
                </CardContent>
              </Card>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <DataPreview data={data} stats={stats} />
            </div>

            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Get started with your analysis</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {quickActions.map((action) => (
                  <Link key={action.href} href={action.href}>
                    <Button variant="ghost" className="w-full justify-between h-auto py-4 px-4 hover:bg-muted border border-transparent hover:border-border">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg border ${action.tone}`}>
                          <action.icon className="w-4 h-4" />
                        </div>
                        <div className="text-left">
                          <p className="font-medium text-foreground">{action.label}</p>
                          <p className="text-sm text-muted-foreground">{action.description}</p>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-muted-foreground" />
                    </Button>
                  </Link>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
