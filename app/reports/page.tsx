"use client"

import { useState, useEffect, useRef } from "react"
import { SidebarNav } from "@/components/sidebar-nav"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { FileText, Download, AlertCircle, Upload, Printer, CheckCircle2 } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"
import { soilDataStore } from "@/lib/soil-data-store"
import { calculateStats } from "@/lib/utils"
import type { SoilSample, DatasetStats, ClusterResult, PredictionResult } from "@/lib/types"

export default function ReportsPage() {
  const [data, setData] = useState<SoilSample[]>([])
  const [stats, setStats] = useState<DatasetStats | null>(null)
  const [clusters, setClusters] = useState<ClusterResult[]>([])
  const [predictions, setPredictions] = useState<PredictionResult[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const reportRef = useRef<HTMLDivElement>(null)

  const [reportOptions, setReportOptions] = useState({
    includeSummary: true,
    includeDataStats: true,
    includePredictions: true,
    includeClusters: true,
    includeRecommendations: true,
  })

  useEffect(() => {
    const storeData = soilDataStore.getData()
    const storeStats = soilDataStore.getStats()
    const storeClusters = soilDataStore.getClusters()
    const storePredictions = soilDataStore.getPredictions()
    
    setData(storeData)
    setClusters(storeClusters)
    setPredictions(storePredictions)
    
    // Calculate stats if not available in store
    if (storeStats && storeData.length > 0) {
      setStats(storeStats)
    } else if (storeData.length > 0) {
      const calculatedStats = calculateStats(storeData)
      setStats(calculatedStats)
      soilDataStore.setStats(calculatedStats)
    }
  }, [])

  const generateReport = async () => {
    setIsGenerating(true)
    await new Promise((resolve) => setTimeout(resolve, 500))
    setIsGenerating(false)
    toast.success("Report generated successfully")
  }

  const printReport = () => {
    const printContent = reportRef.current
    if (!printContent) return

    const printWindow = window.open("", "_blank")
    if (!printWindow) {
      toast.error("Please allow popups to print the report")
      return
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Soil Productivity Report</title>
          <style>
            body { font-family: system-ui, sans-serif; padding: 40px; color: #1a1a1a; }
            h1 { color: #166534; border-bottom: 2px solid #166534; padding-bottom: 10px; }
            h2 { color: #166534; margin-top: 30px; }
            h3 { color: #374151; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { border: 1px solid #e5e7eb; padding: 12px; text-align: left; }
            th { background: #f3f4f6; font-weight: 600; }
            .stat-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin: 20px 0; }
            .stat-box { background: #f9fafb; padding: 16px; border-radius: 8px; border: 1px solid #e5e7eb; }
            .stat-label { font-size: 12px; color: #6b7280; text-transform: uppercase; }
            .stat-value { font-size: 24px; font-weight: 700; color: #166534; }
            .badge { display: inline-block; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 500; }
            .badge-high { background: #dcfce7; color: #166534; }
            .badge-medium { background: #fef3c7; color: #92400e; }
            .badge-low { background: #fecaca; color: #991b1b; }
            .section { page-break-inside: avoid; margin-bottom: 30px; }
            @media print { body { padding: 20px; } }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `)
    printWindow.document.close()
    printWindow.print()
  }

  const summary = {
    high: predictions.filter((p) => p.productivityClass === "High").length,
    medium: predictions.filter((p) => p.productivityClass === "Medium").length,
    low: predictions.filter((p) => p.productivityClass === "Low").length,
    avgScore:
      predictions.length > 0 ? predictions.reduce((sum, p) => sum + p.productivityScore, 0) / predictions.length : 0,
  }
  const soilTypeSummary = Object.values(
    predictions.reduce((acc, pred) => {
      const type = pred.soilType || pred.sample.soilType || "Unspecified"
      if (!acc[type]) {
        acc[type] = {
          soilType: type,
          sampleCount: 0,
          crops: new Set<string>(),
        }
      }
      acc[type].sampleCount += 1
      pred.recommendedCrops.forEach((crop) => acc[type].crops.add(crop))
      return acc
    }, {} as Record<string, { soilType: string; sampleCount: number; crops: Set<string> }>)
  ).map((entry) => ({
    soilType: entry.soilType,
    sampleCount: entry.sampleCount,
    crops: Array.from(entry.crops),
  }))

  const hasData = data.length > 0

  if (!hasData) {
    return (
      <div className="flex h-screen">
        <SidebarNav />
        <main className="flex-1 overflow-auto">
          <div className="p-6">
            <h1 className="text-2xl font-bold text-foreground mb-2">Generate Reports</h1>
            <p className="text-muted-foreground mb-6">Export analysis results as PDF reports</p>

            <Card className="bg-card border-border">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <AlertCircle className="w-12 h-12 text-muted-foreground mb-4" />
                <p className="text-foreground font-medium mb-2">No analysis data available</p>
                <p className="text-sm text-muted-foreground mb-4">Please upload data and run predictions first</p>
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
              <h1 className="text-2xl font-bold text-foreground">Generate Reports</h1>
              <p className="text-muted-foreground">Export analysis results as printable reports</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={printReport} disabled={isGenerating}>
                <Printer className="w-4 h-4 mr-2" />
                Print Report
              </Button>
              <Button onClick={generateReport} disabled={isGenerating}>
                {isGenerating ? (
                  <>Generating...</>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Generate Report
                  </>
                )}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-base">Report Options</CardTitle>
                <CardDescription>Select sections to include</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(reportOptions).map(([key, value]) => (
                  <div key={key} className="flex items-center space-x-2">
                    <Checkbox
                      id={key}
                      checked={value}
                      onCheckedChange={(checked) => setReportOptions((prev) => ({ ...prev, [key]: checked === true }))}
                    />
                    <Label htmlFor={key} className="text-sm text-foreground cursor-pointer">
                      {key
                        .replace("include", "")
                        .replace(/([A-Z])/g, " $1")
                        .trim()}
                    </Label>
                  </div>
                ))}
              </CardContent>
            </Card>

            <div className="lg:col-span-3">
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-primary" />
                    Report Preview
                  </CardTitle>
                  <CardDescription>Preview of the generated report</CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[600px]">
                    <div ref={reportRef} className="p-6 bg-background rounded-lg space-y-6">
                      <div className="text-center border-b border-border pb-6">
                        <h1 className="text-2xl font-bold text-primary mb-2">Soil Productivity Analysis Report</h1>
                        <p className="text-muted-foreground">
                          Generated on{" "}
                          {new Date().toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </p>
                      </div>

                      {reportOptions.includeSummary && (
                        <div className="section">
                          <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                            <CheckCircle2 className="w-5 h-5 text-primary" />
                            Executive Summary
                          </h2>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="p-4 bg-muted rounded-lg">
                              <p className="text-xs text-muted-foreground uppercase">Total Samples</p>
                              <p className="text-2xl font-bold text-foreground">{data.length}</p>
                            </div>
                            <div className="p-4 bg-muted rounded-lg">
                              <p className="text-xs text-muted-foreground uppercase">High Productivity</p>
                              <p className="text-2xl font-bold text-primary">{summary.high}</p>
                            </div>
                            <div className="p-4 bg-muted rounded-lg">
                              <p className="text-xs text-muted-foreground uppercase">Medium Productivity</p>
                              <p className="text-2xl font-bold text-chart-3">{summary.medium}</p>
                            </div>
                            <div className="p-4 bg-muted rounded-lg">
                              <p className="text-xs text-muted-foreground uppercase">Low Productivity</p>
                              <p className="text-2xl font-bold text-destructive">{summary.low}</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {reportOptions.includeDataStats && stats && (
                        <div className="section">
                          <h2 className="text-lg font-semibold text-foreground mb-4">Dataset Statistics</h2>
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="border-b border-border">
                                  <th className="text-left p-2 text-muted-foreground">Parameter</th>
                                  <th className="text-right p-2 text-muted-foreground">Min</th>
                                  <th className="text-right p-2 text-muted-foreground">Max</th>
                                  <th className="text-right p-2 text-muted-foreground">Mean</th>
                                  <th className="text-right p-2 text-muted-foreground">Std Dev</th>
                                </tr>
                              </thead>
                              <tbody>
                                {Object.entries(stats.summary)
                                  .slice(0, 8)
                                  .map(([key, value]) => (
                                    <tr key={key} className="border-b border-border/50">
                                      <td className="p-2 text-foreground capitalize">
                                        {key.replace(/([A-Z])/g, " $1")}
                                      </td>
                                      <td className="text-right p-2 text-muted-foreground">{value.min.toFixed(2)}</td>
                                      <td className="text-right p-2 text-muted-foreground">{value.max.toFixed(2)}</td>
                                      <td className="text-right p-2 text-foreground font-medium">
                                        {value.mean.toFixed(2)}
                                      </td>
                                      <td className="text-right p-2 text-muted-foreground">{value.std.toFixed(2)}</td>
                                    </tr>
                                  ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      {reportOptions.includePredictions && predictions.length > 0 && (
                        <div className="section">
                          <h2 className="text-lg font-semibold text-foreground mb-4">Productivity Predictions</h2>
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="border-b border-border">
                                  <th className="text-left p-2 text-muted-foreground">Sample</th>
                                  <th className="text-right p-2 text-muted-foreground">N</th>
                                  <th className="text-right p-2 text-muted-foreground">P</th>
                                  <th className="text-right p-2 text-muted-foreground">K</th>
                                  <th className="text-right p-2 text-muted-foreground">pH</th>
                                  <th className="text-right p-2 text-muted-foreground">Score</th>
                                  <th className="text-center p-2 text-muted-foreground">Class</th>
                                </tr>
                              </thead>
                              <tbody>
                                {predictions.slice(0, 15).map((pred, idx) => (
                                  <tr key={pred.sample.id} className="border-b border-border/50">
                                    <td className="p-2 text-foreground">{idx + 1}</td>
                                    <td className="text-right p-2 text-muted-foreground">
                                      {(pred.sample.nitrogen || 0).toFixed(1)}
                                    </td>
                                    <td className="text-right p-2 text-muted-foreground">
                                      {(pred.sample.phosphorus || 0).toFixed(1)}
                                    </td>
                                    <td className="text-right p-2 text-muted-foreground">
                                      {(pred.sample.potassium || 0).toFixed(1)}
                                    </td>
                                    <td className="text-right p-2 text-muted-foreground">
                                      {(pred.sample.ph || 7).toFixed(2)}
                                    </td>
                                    <td className="text-right p-2 text-foreground font-medium">
                                      {pred.productivityScore}
                                    </td>
                                    <td className="text-center p-2">
                                      <Badge
                                        className={
                                          pred.productivityClass === "High"
                                            ? "bg-primary/20 text-primary"
                                            : pred.productivityClass === "Medium"
                                              ? "bg-chart-3/20 text-chart-3"
                                              : "bg-destructive/20 text-destructive"
                                        }
                                      >
                                        {pred.productivityClass}
                                      </Badge>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                          {predictions.length > 15 && (
                            <p className="text-sm text-muted-foreground mt-2">
                              Showing 15 of {predictions.length} samples
                            </p>
                          )}
                        </div>
                      )}

                      {predictions.length > 0 && (
                        <div className="section">
                          <h2 className="text-lg font-semibold text-foreground mb-4">Soil Type and Crop Suitability</h2>
                          <div className="space-y-3">
                            {soilTypeSummary.map((item) => (
                              <div key={item.soilType} className="p-4 bg-muted rounded-lg">
                                <p className="font-medium text-foreground">
                                  Soil Type: {item.soilType}
                                </p>
                                <p className="text-sm text-muted-foreground mb-2">
                                  Samples in dataset: {item.sampleCount}
                                </p>
                                <p className="text-sm text-foreground">Recommended crops/plants:</p>
                                <ul className="text-sm text-muted-foreground mt-1 space-y-1">
                                  {item.crops.map((crop) => (
                                    <li key={`${item.soilType}-${crop}`}>- {crop}</li>
                                  ))}
                                </ul>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {reportOptions.includeClusters && clusters.length > 0 && (
                        <div className="section">
                          <h2 className="text-lg font-semibold text-foreground mb-4">Cluster Analysis</h2>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {clusters.map((cluster) => (
                              <div
                                key={cluster.cluster}
                                className="p-4 bg-muted rounded-lg"
                                style={{ borderLeft: `4px solid ${cluster.color}` }}
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <span className="font-semibold text-foreground">Cluster {cluster.cluster + 1}</span>
                                  <Badge variant="secondary">{cluster.samples.length} samples</Badge>
                                </div>
                                <p className="text-sm text-muted-foreground">{cluster.characteristics}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {reportOptions.includeRecommendations && predictions.length > 0 && (
                        <div className="section">
                          <h2 className="text-lg font-semibold text-foreground mb-4">Key Recommendations</h2>
                          <div className="space-y-3">
                            {predictions
                              .filter((p) => p.productivityClass === "Low")
                              .slice(0, 5)
                              .map((pred, idx) => (
                                <div key={pred.sample.id} className="p-3 bg-muted rounded-lg">
                                  <p className="font-medium text-foreground text-sm mb-1">
                                    Sample {predictions.indexOf(pred) + 1} (Score: {pred.productivityScore})
                                  </p>
                                  <ul className="text-sm text-muted-foreground space-y-1">
                                    {pred.recommendations.map((rec, i) => (
                                      <li key={i}>• {rec}</li>
                                    ))}
                                  </ul>
                                </div>
                              ))}
                            {predictions.filter((p) => p.productivityClass === "Low").length === 0 && (
                              <p className="text-muted-foreground">
                                All samples show acceptable productivity levels. Continue current practices.
                              </p>
                            )}
                          </div>
                        </div>
                      )}

                      <Separator className="my-6" />
                      <p className="text-xs text-muted-foreground text-center">
                        Generated by SoilPredict - ML-Based Soil Productivity Prediction System
                      </p>
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
