"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { Database, TrendingUp, TrendingDown, Minus } from "lucide-react"
import type { SoilSample, DatasetStats } from "@/lib/types"

interface DataPreviewProps {
  data: SoilSample[]
  stats: DatasetStats | null
}

export function DataPreview({ data, stats }: DataPreviewProps) {
  if (data.length === 0) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Database className="w-12 h-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No data loaded yet</p>
          <p className="text-sm text-muted-foreground">Upload a dataset to preview</p>
        </CardContent>
      </Card>
    )
  }

  const displayFields: (keyof SoilSample)[] = [
    "nitrogen",
    "phosphorus",
    "potassium",
    "ph",
    "organicCarbon",
    "soilMoisture",
  ]

  const fieldLabels: Record<string, string> = {
    nitrogen: "N",
    phosphorus: "P",
    potassium: "K",
    ph: "pH",
    organicCarbon: "OC",
    soilMoisture: "Moisture",
  }

  const getTrendIcon = (value: number, mean: number) => {
    const diff = ((value - mean) / mean) * 100
    if (diff > 10) return <TrendingUp className="w-3 h-3 text-primary" />
    if (diff < -10) return <TrendingDown className="w-3 h-3 text-destructive" />
    return <Minus className="w-3 h-3 text-muted-foreground" />
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5 text-primary" />
              Data Preview
            </CardTitle>
            <CardDescription>Showing first 10 of {data.length} samples</CardDescription>
          </div>
          <Badge variant="secondary" className="bg-primary/20 text-primary">
            {data.length} samples
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="w-full whitespace-nowrap">
          <Table>
            <TableHeader>
              <TableRow className="border-border">
                <TableHead className="text-muted-foreground">ID</TableHead>
                {displayFields.map((field) => (
                  <TableHead key={field} className="text-muted-foreground">
                    {fieldLabels[field]}
                    {stats?.summary[field] && (
                      <span className="block text-xs font-normal">μ: {stats.summary[field].mean.toFixed(1)}</span>
                    )}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.slice(0, 10).map((sample, idx) => (
                <TableRow key={sample.id} className="border-border">
                  <TableCell className="font-mono text-sm text-muted-foreground">{idx + 1}</TableCell>
                  {displayFields.map((field) => (
                    <TableCell key={field}>
                      <div className="flex items-center gap-1">
                        <span className="text-foreground">{(sample[field] as number).toFixed(2)}</span>
                        {stats?.summary[field] && getTrendIcon(sample[field] as number, stats.summary[field].mean)}
                      </div>
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>

        {stats && (
          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(stats.summary)
              .slice(0, 4)
              .map(([key, value]) => (
                <div key={key} className="p-3 bg-muted rounded-lg">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">{fieldLabels[key] || key}</p>
                  <p className="text-lg font-semibold text-foreground">{value.mean.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground">
                    Range: {value.min.toFixed(1)} - {value.max.toFixed(1)}
                  </p>
                </div>
              ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
