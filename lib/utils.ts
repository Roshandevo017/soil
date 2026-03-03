import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { SoilSample, DatasetStats } from './types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function calculateStats(data: SoilSample[]): DatasetStats {
  const numericFields: (keyof SoilSample)[] = [
    "nitrogen",
    "phosphorus", 
    "potassium",
    "ph",
    "organicCarbon",
    "electricalConductivity",
    "sulphur",
    "zinc",
    "iron",
    "copper",
    "manganese",
    "boron",
    "soilMoisture",
    "temperature",
    "humidity",
    "rainfall",
  ]

  const summary: DatasetStats["summary"] = {}

  numericFields.forEach((field) => {
    const values = data
      .map((d) => d[field] as number)
      .filter((v) => v !== null && v !== undefined && !isNaN(v))
    
    if (values.length > 0) {
      const min = Math.min(...values)
      const max = Math.max(...values)
      const mean = values.reduce((a, b) => a + b, 0) / values.length
      const std = Math.sqrt(values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length)
      summary[field] = { min, max, mean, std }
    } else {
      // Provide default values when no valid data
      summary[field] = { min: 0, max: 0, mean: 0, std: 0 }
    }
  })

  return {
    totalSamples: data.length,
    features: numericFields as string[],
    summary,
  }
}
