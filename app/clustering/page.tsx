"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { SidebarNav } from "@/components/sidebar-nav"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Layers, Play, ArrowRight, AlertCircle, Upload } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"
import { soilDataStore } from "@/lib/soil-data-store"
import { kMeansClustering, performPCA } from "@/lib/ml-algorithms"
import { ClusterScatterChart } from "@/components/cluster-scatter-chart"
import { ClusterDistributionChart } from "@/components/cluster-distribution-chart"
import type { SoilSample, ClusterResult } from "@/lib/types"

export default function ClusteringPage() {
  const router = useRouter()
  const [data, setData] = useState<SoilSample[]>([])
  const [clusters, setClusters] = useState<ClusterResult[]>([])
  const [numClusters, setNumClusters] = useState("3")
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [pcaData, setPcaData] = useState<{ x: number; y: number; cluster: number; id: string }[]>([])

  useEffect(() => {
    setData(soilDataStore.getData())
    setClusters(soilDataStore.getClusters())
    const storedClusters = soilDataStore.getClusters()
    if (storedClusters.length > 0) {
      const storedData = soilDataStore.getData()
      setPcaData(performPCA(storedData))
    }
  }, [])

  const runClustering = async () => {
    if (data.length === 0) {
      toast.error("Please upload data first")
      return
    }

    setIsProcessing(true)
    setProgress(0)

    const interval = setInterval(() => {
      setProgress((prev) => Math.min(prev + 20, 90))
    }, 150)

    await new Promise((resolve) => setTimeout(resolve, 1200))

    const k = Number.parseInt(numClusters)
    const { clusters: newClusters, labeledData } = kMeansClustering(data, k)

    setClusters(newClusters)
    soilDataStore.setClusters(newClusters)
    soilDataStore.setData(labeledData)
    setData(labeledData)

    const pca = performPCA(labeledData)
    setPcaData(pca)

    clearInterval(interval)
    setProgress(100)
    setIsProcessing(false)
    toast.success(`Created ${k} clusters from ${data.length} samples`)
  }

  if (data.length === 0) {
    return (
      <div className="flex h-screen">
        <SidebarNav />
        <main className="flex-1 overflow-auto">
          <div className="p-6">
            <h1 className="text-2xl font-bold text-foreground mb-2">Soil Clustering</h1>
            <p className="text-muted-foreground mb-6">Group similar soil samples using K-Means clustering</p>

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
              <h1 className="text-2xl font-bold text-foreground">Soil Clustering</h1>
              <p className="text-muted-foreground">Group similar soil samples using K-Means clustering</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Clusters:</span>
                <Select value={numClusters} onValueChange={setNumClusters}>
                  <SelectTrigger className="w-20 bg-input border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2">2</SelectItem>
                    <SelectItem value="3">3</SelectItem>
                    <SelectItem value="4">4</SelectItem>
                    <SelectItem value="5">5</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={runClustering} disabled={isProcessing}>
                {isProcessing ? (
                  <>Processing...</>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Run Clustering
                  </>
                )}
              </Button>
              {clusters.length > 0 && (
                <Button variant="outline" onClick={() => router.push("/reports")}>
                  Generate Report
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              )}
            </div>
          </div>

          {isProcessing && (
            <Card className="bg-card border-border">
              <CardContent className="py-6">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Running K-Means clustering...</span>
                    <span className="text-foreground">{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
              </CardContent>
            </Card>
          )}

          {clusters.length > 0 && (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="bg-card border-border">
                  <CardHeader>
                    <CardTitle>Cluster Visualization (PCA)</CardTitle>
                    <CardDescription>2D projection of soil samples by cluster</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ClusterScatterChart data={pcaData} clusters={clusters} />
                  </CardContent>
                </Card>

                <Card className="bg-card border-border">
                  <CardHeader>
                    <CardTitle>Cluster Distribution</CardTitle>
                    <CardDescription>Number of samples per cluster</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ClusterDistributionChart clusters={clusters} />
                  </CardContent>
                </Card>
              </div>

              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Layers className="w-5 h-5 text-primary" />
                    Cluster Analysis
                  </CardTitle>
                  <CardDescription>Detailed breakdown of each cluster</CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[300px]">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {clusters.map((cluster) => (
                        <div
                          key={cluster.cluster}
                          className="p-4 bg-muted rounded-lg"
                          style={{ borderLeft: `4px solid ${cluster.color}` }}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <span className="font-semibold text-foreground">Cluster {cluster.cluster + 1}</span>
                            <Badge variant="secondary">{cluster.samples.length} samples</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-3">{cluster.characteristics}</p>
                          <div className="space-y-2 text-xs">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Avg N:</span>
                              <span className="text-foreground">
                                {(cluster.samples.reduce((s, d) => s + (d.nitrogen || 0), 0) / cluster.samples.length).toFixed(
                                  1,
                                )}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Avg P:</span>
                              <span className="text-foreground">
                                {(
                                  cluster.samples.reduce((s, d) => s + (d.phosphorus || 0), 0) / cluster.samples.length
                                ).toFixed(1)}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Avg K:</span>
                              <span className="text-foreground">
                                {(
                                  cluster.samples.reduce((s, d) => s + (d.potassium || 0), 0) / cluster.samples.length
                                ).toFixed(1)}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Avg pH:</span>
                              <span className="text-foreground">
                                {(cluster.samples.reduce((s, d) => s + (d.ph || 7), 0) / cluster.samples.length).toFixed(2)}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </>
          )}

          {clusters.length === 0 && !isProcessing && (
            <Card className="bg-card border-border">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Layers className="w-12 h-12 text-muted-foreground mb-4" />
                <p className="text-foreground font-medium mb-2">Ready to cluster</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Select number of clusters and click "Run Clustering" to analyze {data.length} samples
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}
