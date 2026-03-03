"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { SidebarNav } from "@/components/sidebar-nav"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  LineChart,
  Play,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Minus,
  Upload,
} from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"
import { soilDataStore } from "@/lib/soil-data-store"
import { predictProductivity } from "@/lib/ml-algorithms"
import { predictSingleSample, predictFromFile, checkBackendHealth } from "@/lib/api-service"
import { ProductivityPieChart } from "@/components/productivity-pie-chart"
import { ScoreHistogram } from "@/components/score-histogram"
import { FeatureCorrelationHeatmap } from "@/components/feature-correlation-heatmap"
import type { SoilSample, PredictionResult } from "@/lib/types"

export default function PredictionPage() {
  const router = useRouter()
  const [data, setData] = useState<SoilSample[]>([])
  const [predictions, setPredictions] = useState<PredictionResult[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [backendAvailable, setBackendAvailable] = useState<boolean | null>(null)
  const [activeSection, setActiveSection] = useState<"results" | "recommendations">("results")
  const [focusView, setFocusView] = useState(false)

  useEffect(() => {
    setData(soilDataStore.getData())
    setPredictions(soilDataStore.getPredictions())
    
    // Check backend availability
    checkBackendHealth().then((health) => {
      setBackendAvailable(health !== null && health.model_loaded)
    })
  }, [])

  const runPrediction = async () => {
    if (data.length === 0) {
      toast.error("Please upload data first")
      return
    }

    setIsProcessing(true)
    setProgress(0)

    try {
      // Check backend availability
      const health = await checkBackendHealth()
      const useBackend = health !== null && health.model_loaded
      setBackendAvailable(useBackend)

      if (useBackend) {
        // Use backend API for predictions
        toast.info("Using backend ML model for predictions...")
        setProgress(10)

        const results: PredictionResult[] = []
        const batchSize = 10
        const totalBatches = Math.ceil(data.length / batchSize)

        for (let i = 0; i < data.length; i += batchSize) {
          const batch = data.slice(i, i + batchSize)
          const batchResults = await Promise.all(
            batch.map(async (sample) => {
              try {
                return await predictSingleSample(sample)
              } catch (error) {
                // Fallback to local prediction if backend fails for this sample
                console.warn(`Backend prediction failed for sample ${sample.id}, using fallback:`, error)
                const localResults = predictProductivity([sample])
                return localResults[0]
              }
            })
          )
          results.push(...batchResults)
          setProgress(10 + Math.floor((i / data.length) * 80))
        }

        setPredictions(results)
        soilDataStore.setPredictions(results)

        const updatedData = results.map((r) => r.sample)
        soilDataStore.setData(updatedData)

        setProgress(100)
        toast.success(`Predicted productivity for ${results.length} samples using ML model`)
      } else {
        // Fallback to local prediction
        toast.warning("Backend unavailable, using client-side prediction")
        const interval = setInterval(() => {
          setProgress((prev) => Math.min(prev + 15, 90))
        }, 200)

        await new Promise((resolve) => setTimeout(resolve, 1500))

        const results = predictProductivity(data)
        setPredictions(results)
        soilDataStore.setPredictions(results)

        const updatedData = results.map((r) => r.sample)
        soilDataStore.setData(updatedData)

        clearInterval(interval)
        setProgress(100)
        toast.success(`Predicted productivity for ${results.length} samples (client-side)`)
      }
    } catch (error) {
      console.error("Prediction error:", error)
      toast.error(`Prediction failed: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setIsProcessing(false)
    }
  }

  const getClassBadge = (cls: string) => {
    switch (cls) {
      case "High":
        return (
          <Badge className="bg-primary/20 text-primary border-primary/30">
            <TrendingUp className="w-3 h-3 mr-1" />
            High
          </Badge>
        )
      case "Medium":
        return (
          <Badge className="bg-chart-3/20 text-chart-3 border-chart-3/30">
            <Minus className="w-3 h-3 mr-1" />
            Medium
          </Badge>
        )
      default:
        return (
          <Badge className="bg-destructive/20 text-destructive border-destructive/30">
            <TrendingDown className="w-3 h-3 mr-1" />
            Low
          </Badge>
        )
    }
  }

  const summary = {
    high: predictions.filter((p) => p.productivityClass === "High").length,
    medium: predictions.filter((p) => p.productivityClass === "Medium").length,
    low: predictions.filter((p) => p.productivityClass === "Low").length,
    avgScore:
      predictions.length > 0 ? predictions.reduce((sum, p) => sum + p.productivityScore, 0) / predictions.length : 0,
  }

  const openSection = (section: "results" | "recommendations") => {
    setActiveSection(section)
    setFocusView(true)
  }

  if (data.length === 0) {
    return (
      <div className="flex h-screen">
        <SidebarNav />
        <main className="flex-1 overflow-auto">
          <div className="p-6">
            <h1 className="text-2xl font-bold text-foreground mb-2">Productivity Prediction</h1>
            <p className="text-muted-foreground mb-6">Predict soil productivity using ML models</p>

            <Card className="bg-card border-border">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <AlertCircle className="w-12 h-12 text-muted-foreground mb-4" />
                <p className="text-foreground font-medium mb-2">No data available</p>
                <p className="text-sm text-muted-foreground mb-4">Please upload a dataset first</p>
                <Link href="/upload">
                  <Button>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Data
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="flex h-screen">
      <SidebarNav />
      <main className="flex-1 overflow-auto">
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Productivity Prediction</h1>
              <p className="text-muted-foreground">Predict soil productivity using ML models</p>
            </div>
            <div className="flex gap-2">
              <Button onClick={runPrediction} disabled={isProcessing}>
                {isProcessing ? (
                  <>Processing...</>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Run Prediction
                  </>
                )}
              </Button>
              {predictions.length > 0 && (
                <Button variant="outline" onClick={() => router.push("/clustering")}>
                  View Clusters
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              )}
            </div>
            {backendAvailable !== null && (
              <div className="text-xs text-muted-foreground mt-2">
                {backendAvailable ? (
                  <span className="text-green-600 dark:text-green-400">
                    âœ“ Connected to backend ML model
                  </span>
                ) : (
                  <span className="text-yellow-600 dark:text-yellow-400">
                    âš  Using client-side prediction (backend unavailable)
                  </span>
                )}
              </div>
            )}
          </div>

          {predictions.length > 0 && (
            <Card className="bg-card border-border">
              <CardContent className="py-4 flex flex-wrap items-center gap-3">
                <Button
                  variant={focusView && activeSection === "results" ? "default" : "outline"}
                  onClick={() => openSection("results")}
                >
                  Results
                </Button>
                <Button
                  variant={focusView && activeSection === "recommendations" ? "default" : "outline"}
                  onClick={() => openSection("recommendations")}
                >
                  Recommendations
                </Button>
                {focusView && (
                  <Button variant="ghost" onClick={() => setFocusView(false)}>
                    Back to Overview
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {isProcessing && (
            <Card className="bg-card border-border">
              <CardContent className="py-6">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Running ML prediction model...</span>
                    <span className="text-foreground">{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
              </CardContent>
            </Card>
          )}

          {predictions.length > 0 && !focusView && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="bg-card border-border">
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground">High Productivity</p>
                    <p className="text-2xl font-bold text-primary">{summary.high}</p>
                    <p className="text-xs text-muted-foreground">
                      {((summary.high / predictions.length) * 100).toFixed(1)}% of samples
                    </p>
                  </CardContent>
                </Card>
                <Card className="bg-card border-border">
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground">Medium Productivity</p>
                    <p className="text-2xl font-bold text-chart-3">{summary.medium}</p>
                    <p className="text-xs text-muted-foreground">
                      {((summary.medium / predictions.length) * 100).toFixed(1)}% of samples
                    </p>
                  </CardContent>
                </Card>
                <Card className="bg-card border-border">
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground">Low Productivity</p>
                    <p className="text-2xl font-bold text-destructive">{summary.low}</p>
                    <p className="text-xs text-muted-foreground">
                      {((summary.low / predictions.length) * 100).toFixed(1)}% of samples
                    </p>
                  </CardContent>
                </Card>
                <Card className="bg-card border-border">
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground">Average Score</p>
                    <p className="text-2xl font-bold text-foreground">{summary.avgScore.toFixed(1)}</p>
                    <p className="text-xs text-muted-foreground">Out of 100</p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-card border-border">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Class Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ProductivityPieChart predictions={predictions} />
                  </CardContent>
                </Card>

                <Card className="bg-card border-border">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Score Histogram</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScoreHistogram predictions={predictions} />
                  </CardContent>
                </Card>

                <Card className="bg-card border-border">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Feature Correlations</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <FeatureCorrelationHeatmap data={data} />
                  </CardContent>
                </Card>
              </div>

            </>
          )}

          {predictions.length > 0 && focusView && activeSection === "results" && (
                <Card className="bg-card border-border">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <LineChart className="w-5 h-5 text-primary" />
                      Prediction Results
                    </CardTitle>
                    <CardDescription>Productivity predictions for {predictions.length} soil samples</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[600px]">
                      <Table>
                        <TableHeader>
                          <TableRow className="border-border">
                            <TableHead className="text-muted-foreground">Sample</TableHead>
                            <TableHead className="text-muted-foreground">N</TableHead>
                            <TableHead className="text-muted-foreground">P</TableHead>
                            <TableHead className="text-muted-foreground">K</TableHead>
                            <TableHead className="text-muted-foreground">pH</TableHead>
                            <TableHead className="text-muted-foreground">Soil Type</TableHead>
                            <TableHead className="text-muted-foreground">Score</TableHead>
                            <TableHead className="text-muted-foreground">Class</TableHead>
                            <TableHead className="text-muted-foreground">Yield Potential</TableHead>
                            <TableHead className="text-muted-foreground">Confidence</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {predictions.map((pred, idx) => (
                            <TableRow key={pred.sample.id} className="border-border">
                              <TableCell className="font-mono text-sm text-muted-foreground">{idx + 1}</TableCell>
                              <TableCell className="text-foreground">{(pred.sample.nitrogen || 0).toFixed(1)}</TableCell>
                              <TableCell className="text-foreground">{(pred.sample.phosphorus || 0).toFixed(1)}</TableCell>
                              <TableCell className="text-foreground">{(pred.sample.potassium || 0).toFixed(1)}</TableCell>
                              <TableCell className="text-foreground">{(pred.sample.ph || 7).toFixed(2)}</TableCell>
                              <TableCell className="text-foreground">{pred.soilType}</TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Progress value={pred.productivityScore} className="w-16 h-2" />
                                  <span className="text-foreground">{pred.productivityScore}</span>
                                </div>
                              </TableCell>
                              <TableCell>{getClassBadge(pred.productivityClass)}</TableCell>
                              <TableCell className="text-muted-foreground">
                                {pred.expectedYieldPotential.category} ({pred.expectedYieldPotential.estimatedRange})
                              </TableCell>
                              <TableCell className="text-muted-foreground">
                                {(pred.confidence * 100).toFixed(0)}%
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </ScrollArea>
                  </CardContent>
                </Card>
          )}

          {predictions.length > 0 && focusView && activeSection === "recommendations" && (
                <Card className="bg-card border-border">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-primary" />
                      Soil Intelligence Recommendations
                    </CardTitle>
                    <CardDescription>Soil type, practices, crops, feasibility, and yield outlook</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[600px]">
                      <div className="space-y-4">
                        {predictions.slice(0, 50).map((pred, idx) => (
                          <div key={pred.sample.id} className="p-4 bg-muted rounded-lg">
                            <div className="flex items-center justify-between mb-3">
                              <span className="font-medium text-foreground">Sample {idx + 1}</span>
                              {getClassBadge(pred.productivityClass)}
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                              <div className="rounded-md bg-background/60 p-3">
                                <p className="text-xs uppercase text-muted-foreground mb-1">Soil Type</p>
                                <p className="text-foreground font-medium">{pred.soilType}</p>
                              </div>
                              <div className="rounded-md bg-background/60 p-3">
                                <p className="text-xs uppercase text-muted-foreground mb-1">Farming Feasibility</p>
                                <p className="text-foreground font-medium">{pred.feasibility}</p>
                              </div>
                              <div className="rounded-md bg-background/60 p-3 md:col-span-2">
                                <p className="text-xs uppercase text-muted-foreground mb-1">Expected Yield Potential</p>
                                <p className="text-foreground font-medium">
                                  {pred.expectedYieldPotential.category} ({pred.expectedYieldPotential.estimatedRange})
                                </p>
                                <p className="text-muted-foreground mt-1">{pred.expectedYieldPotential.interpretation}</p>
                              </div>
                              <div className="rounded-md bg-background/60 p-3">
                                <p className="text-xs uppercase text-muted-foreground mb-1">Suitable Agricultural Practices</p>
                                <ul className="space-y-1">
                                  {pred.suitablePractices.map((practice, i) => (
                                    <li key={i} className="text-muted-foreground">- {practice}</li>
                                  ))}
                                </ul>
                              </div>
                              <div className="rounded-md bg-background/60 p-3">
                                <p className="text-xs uppercase text-muted-foreground mb-1">Recommended Crops</p>
                                <ul className="space-y-1">
                                  {pred.recommendedCrops.map((crop, i) => (
                                    <li key={i} className="text-muted-foreground">- {crop}</li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
          )}

          {predictions.length === 0 && !isProcessing && (
            <Card className="bg-card border-border">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <LineChart className="w-12 h-12 text-muted-foreground mb-4" />
                <p className="text-foreground font-medium mb-2">Ready to predict</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Click "Run Prediction" to analyze {data.length} soil samples
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}


