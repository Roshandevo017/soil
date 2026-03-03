"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Trash2, FlaskConical } from "lucide-react"
import { toast } from "sonner"
import { predictSingleSample, checkBackendHealth } from "@/lib/api-service"
import type { SoilSample, DatasetStats } from "@/lib/types"

interface ManualSoilFormProps {
  onDataLoaded: (data: SoilSample[], stats: DatasetStats) => void
  existingData: SoilSample[]
}

const defaultSampleValues = {
  nitrogen: null,
  phosphorus: null,
  potassium: null,
  ph:null,
  organicCarbon: null,
  electricalConductivity: null,
  sulphur: null,
  zinc: null,
  iron:null,
  copper: null,
  manganese: null,
  boron: null,
  soilMoisture: null,
  temperature: null,
  humidity: null,
  rainfall: null,
}

const formFields = [
  { key: "ph", label: "pH", min: 0, max: 14, step: 0.1, unit: "" },
  { key: "nitrogen", label: "Nitrogen (N)", min: 0, max: 500, step: 1, unit: "kg/ha" },
  { key: "phosphorus", label: "Phosphorus (P)", min: 0, max: 200, step: 1, unit: "kg/ha" },
  { key: "potassium", label: "Potassium (K)", min: 0, max: 500, step: 1, unit: "kg/ha" },
  { key: "soilMoisture", label: "Moisture", min: 0, max: 100, step: 1, unit: "%" },
  { key: "temperature", label: "Temperature", min: -10, max: 50, step: 0.5, unit: "°C" },
  { key: "rainfall", label: "Rainfall", min: 0, max: 500, step: 1, unit: "mm" },
  { key: "organicCarbon", label: "Organic Carbon", min: 0, max: 10, step: 0.1, unit: "%" },
  { key: "electricalConductivity", label: "EC", min: 0, max: 10, step: 0.1, unit: "dS/m" },
  { key: "sulphur", label: "Sulphur (S)", min: 0, max: 100, step: 1, unit: "ppm" },
  { key: "zinc", label: "Zinc (Zn)", min: 0, max: 20, step: 0.1, unit: "ppm" },
  { key: "iron", label: "Iron (Fe)", min: 0, max: 100, step: 1, unit: "ppm" },
  { key: "copper", label: "Copper (Cu)", min: 0, max: 10, step: 0.1, unit: "ppm" },
  { key: "manganese", label: "Manganese (Mn)", min: 0, max: 50, step: 1, unit: "ppm" },
  { key: "boron", label: "Boron (B)", min: 0, max: 5, step: 0.1, unit: "ppm" },
  { key: "humidity", label: "Humidity", min: 0, max: 100, step: 1, unit: "%" },
]

function generateId(): string {
  return `sample-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

function calculateStats(data: SoilSample[]): DatasetStats {
  const features = Object.keys(defaultSampleValues)
  const summary: DatasetStats["summary"] = {}

  features.forEach((feature) => {
    const values = data.map((s) => s[feature as keyof SoilSample] as number)
    const mean = values.reduce((a, b) => a + b, 0) / values.length
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length
    summary[feature] = {
      min: Math.min(...values),
      max: Math.max(...values),
      mean,
      std: Math.sqrt(variance),
    }
  })

  return {
    totalSamples: data.length,
    features,
    summary,
  }
}

export function ManualSoilForm({ onDataLoaded, existingData }: ManualSoilFormProps) {
  const [formValues, setFormValues] = useState(defaultSampleValues)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [useBackend, setUseBackend] = useState<boolean | null>(null)

  const handleInputChange = (key: string, value: string) => {
    setFormValues((prev) => ({
      ...prev,
      [key]: Number.parseFloat(value) || 0,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    const newSample: SoilSample = {
      id: generateId(),
      ...formValues,
    }

    try {
      // Check if backend is available and get prediction
      const health = await checkBackendHealth()
      const backendAvailable = health && health.status === 'healthy' && health.model_loaded
      setUseBackend(backendAvailable)

      if (backendAvailable) {
        try {
          const prediction = await predictSingleSample(newSample)
          newSample.productivityScore = prediction.productivityScore
          newSample.productivityClass = prediction.productivityClass
          toast.success(`Sample added with ML prediction: ${prediction.productivityScore.toFixed(1)}`)
        } catch (error) {
          console.warn("Backend prediction failed, adding sample without prediction:", error)
          toast.warning("Added sample (backend prediction unavailable)")
        }
      }

      const updatedData = [...existingData, newSample]
      const stats = calculateStats(updatedData)

      onDataLoaded(updatedData, stats)
      setFormValues(defaultSampleValues)
    } catch (error) {
      toast.error("Failed to add sample")
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClearForm = () => {
    setFormValues(defaultSampleValues)
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FlaskConical className="w-5 h-5 text-primary" />
          Manual Entry
        </CardTitle>
        <CardDescription>Enter soil parameters manually to add a sample to your dataset</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {formFields.map((field) => (
              <div key={field.key} className="space-y-1.5">
                <Label htmlFor={field.key} className="text-xs text-muted-foreground">
                  {field.label} {field.unit && <span className="opacity-60">({field.unit})</span>}
                </Label>
                <Input
                  id={field.key}
                  type="number"
                  min={field.min}
                  max={field.max}
                  step={field.step}
                  value={formValues[field.key as keyof typeof formValues] ??''}
                  onChange={(e) => handleInputChange(field.key, e.target.value)}
                  className="h-9 bg-background"
                />
              </div>
            ))}
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={isSubmitting} className="flex-1">
              <Plus className="w-4 h-4 mr-2" />
              Add Sample
            </Button>
            <Button type="button" variant="outline" onClick={handleClearForm}>
              <Trash2 className="w-4 h-4 mr-2" />
              Clear
            </Button>
          </div>

          {existingData.length > 0 && (
            <p className="text-xs text-muted-foreground text-center pt-2">
              {existingData.length} sample{existingData.length !== 1 ? "s" : ""} in dataset
            </p>
          )}
        </form>
      </CardContent>
    </Card>
  )
}
