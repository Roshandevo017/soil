"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { SidebarNav } from "@/components/sidebar-nav"
import { DataUpload } from "@/components/data-upload"
import { DataPreview } from "@/components/data-preview"
import { ManualSoilForm } from "@/components/manual-soil-form"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowRight, Upload, FileSpreadsheet } from "lucide-react"
import { soilDataStore } from "@/lib/soil-data-store"
import type { SoilSample, DatasetStats } from "@/lib/types"

export default function UploadPage() {
  const router = useRouter()
  const [data, setData] = useState<SoilSample[]>([])
  const [stats, setStats] = useState<DatasetStats | null>(null)

  useEffect(() => {
    setData(soilDataStore.getData())
    setStats(soilDataStore.getStats())
  }, [])

  const handleDataLoaded = (newData: SoilSample[], newStats: DatasetStats) => {
    setData(newData)
    setStats(newStats)
    soilDataStore.setData(newData)
    soilDataStore.setStats(newStats)
  }

  const handleClearData = () => {
    setData([])
    setStats(null)
    soilDataStore.setData([])
    soilDataStore.setStats(null)
  }

  return (
    <div className="flex h-screen">
      <SidebarNav />
      <main className="flex-1 overflow-auto">
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Data Input</h1>
              <p className="text-muted-foreground">Upload a CSV file or enter soil parameters manually</p>
            </div>
            <div className="flex gap-2">
              {data.length > 0 && (
                <>
                  <Button variant="outline" onClick={handleClearData}>
                    Clear Data
                  </Button>
                  <Button onClick={() => router.push("/prediction")}>
                    Continue to Prediction
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </>
              )}
            </div>
          </div>

          <Tabs defaultValue="upload" className="space-y-6">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="upload" className="flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4" />
                CSV Upload
              </TabsTrigger>
              <TabsTrigger value="manual" className="flex items-center gap-2">
                <Upload className="w-4 h-4" />
                Manual Entry
              </TabsTrigger>
            </TabsList>

            <TabsContent value="upload" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <DataUpload onDataLoaded={handleDataLoaded} />
                <DataPreview data={data} stats={stats} />
              </div>
            </TabsContent>

            <TabsContent value="manual" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ManualSoilForm onDataLoaded={handleDataLoaded} existingData={data} />
                <DataPreview data={data} stats={stats} />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}
