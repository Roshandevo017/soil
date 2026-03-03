"use client"

import { useState, useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle, X } from "lucide-react"
import { soilDataStore } from "@/lib/soil-data-store"
import { calculateStats } from "@/lib/utils"
import type { SoilSample, DatasetStats } from "@/lib/types"
import { predictFromFile, checkBackendHealth } from "@/lib/api-service"
import { toast } from "@/hooks/use-toast"

interface DataUploadProps {
  onDataLoaded: (data: SoilSample[], stats: DatasetStats) => void
}

export function DataUpload({ onDataLoaded }: DataUploadProps) {
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isProcessing, setIsProcessing] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [backendAvailable, setBackendAvailable] = useState<boolean | null>(null)

  const detectColumns = (text: string): { detected: string[], mapped: string[], unmapped: string[] } => {
    // Remove BOM and normalize line endings
    const cleanText = text.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n')
    const lines = cleanText.trim().split("\n")
    
    if (lines.length === 0) {
      return { detected: [], mapped: [], unmapped: [] }
    }
    
    // Detect delimiter (comma, semicolon, or tab)
    const firstLine = lines[0]
    let delimiter = ','
    const commaCount = (firstLine.match(/,/g) || []).length
    const semicolonCount = (firstLine.match(/;/g) || []).length
    const tabCount = (firstLine.match(/\t/g) || []).length
    
    if (semicolonCount > commaCount && semicolonCount > tabCount) {
      delimiter = ';'
    } else if (tabCount > commaCount && tabCount > semicolonCount) {
      delimiter = '\t'
    }
    
    const headers = firstLine.split(delimiter).map((h) => h.trim().toLowerCase().replace(/"/g, ''))
    
    const fieldMap: Record<string, string> = {
      // Basic nutrients
      n: "nitrogen",
      nitrogen: "nitrogen",
      p: "phosphorus", 
      phosphorus: "phosphorus",
      k: "potassium",
      potassium: "potassium",
      
      // Soil properties
      ph: "ph",
      ph_value: "ph",
      acidity: "ph",
      
      // Organic matter
      oc: "organicCarbon",
      organic_carbon: "organicCarbon",
      organiccarbon: "organicCarbon",
      om: "organicCarbon",
      organic_matter: "organicCarbon",
      organicmatter: "organicCarbon",
      
      // Electrical conductivity
      ec: "electricalConductivity",
      electrical_conductivity: "electricalConductivity",
      conductivity: "electricalConductivity",
      
      // Micronutrients
      s: "sulphur",
      sulphur: "sulphur",
      sulfur: "sulphur",
      zn: "zinc",
      zinc: "zinc",
      fe: "iron",
      iron: "iron",
      cu: "copper",
      copper: "copper",
      mn: "manganese",
      manganese: "manganese",
      b: "boron",
      boron: "boron",
      
      // Environmental factors
      moisture: "soilMoisture",
      soil_moisture: "soilMoisture",
      soilmoisture: "soilMoisture",
      water_content: "soilMoisture",
      watercontent: "soilMoisture",
      temperature: "temperature",
      temp: "temperature",
      soil_temp: "temperature",
      soiltemp: "temperature",
      humidity: "humidity",
      relative_humidity: "humidity",
      relativehumidity: "humidity",
      rainfall: "rainfall",
      rain: "rainfall",
      precipitation: "rainfall",
      
      // Productivity
      productivity: "productivityScore",
      productivity_score: "productivityScore",
      yield: "productivityScore",
      crop_yield: "productivityScore",
      
      // Other
      soil_type: "soilType",
      soiltype: "soilType",
      texture: "soilType",
      location: "location",
      site: "location",
      plot: "location",
    }

    const mapped: string[] = []
    const unmapped: string[] = []

    headers.forEach(header => {
      if (fieldMap[header]) {
        mapped.push(`${header} → ${fieldMap[header]}`)
      } else {
        unmapped.push(header)
      }
    })

    return {
      detected: headers,
      mapped,
      unmapped
    }
  }

  const parseExcel = async (file: File): Promise<string> => {
    const XLSX = await import('xlsx')
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer)
          const workbook = XLSX.read(data, { type: 'array' })
          
          // Get the first worksheet
          const worksheetName = workbook.SheetNames[0]
          const worksheet = workbook.Sheets[worksheetName]
          
          // Convert to CSV
          const csv = XLSX.utils.sheet_to_csv(worksheet)
          resolve(csv)
        } catch (error) {
          reject(new Error("Failed to parse Excel file. Please ensure it's a valid Excel file."))
        }
      }
      
      reader.onerror = () => {
        reject(new Error("Failed to read Excel file."))
      }
      
      reader.readAsArrayBuffer(file)
    })
  }

  const parseCSV = (text: string): SoilSample[] => {
    // Remove BOM and normalize line endings
    const cleanText = text.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n')
    const lines = cleanText.trim().split("\n")
    
    if (lines.length === 0) {
      throw new Error("File is empty or contains no valid data")
    }
    
    // Detect delimiter (comma, semicolon, or tab)
    const firstLine = lines[0]
    let delimiter = ','
    const commaCount = (firstLine.match(/,/g) || []).length
    const semicolonCount = (firstLine.match(/;/g) || []).length
    const tabCount = (firstLine.match(/\t/g) || []).length
    
    if (semicolonCount > commaCount && semicolonCount > tabCount) {
      delimiter = ';'
    } else if (tabCount > commaCount && tabCount > semicolonCount) {
      delimiter = '\t'
    }
    
    const headers = firstLine.split(delimiter).map((h) => h.trim().toLowerCase().replace(/"/g, ''))

    // Enhanced field mapping for custom datasets
    const fieldMap: Record<string, keyof SoilSample> = {
      // Basic nutrients
      n: "nitrogen",
      nitrogen: "nitrogen",
      p: "phosphorus",
      phosphorus: "phosphorus",
      k: "potassium",
      potassium: "potassium",
      
      // Soil properties
      ph: "ph",
      ph_value: "ph",
      acidity: "ph",
      
      // Organic matter variations
      oc: "organicCarbon",
      organic_carbon: "organicCarbon",
      organiccarbon: "organicCarbon",
      om: "organicCarbon",
      organic_matter: "organicCarbon",
      organicmatter: "organicCarbon",
      
      // Electrical conductivity
      ec: "electricalConductivity",
      electrical_conductivity: "electricalConductivity",
      conductivity: "electricalConductivity",
      
      // Micronutrients
      s: "sulphur",
      sulphur: "sulphur",
      sulfur: "sulphur",
      zn: "zinc",
      zinc: "zinc",
      fe: "iron",
      iron: "iron",
      cu: "copper",
      copper: "copper",
      mn: "manganese",
      manganese: "manganese",
      b: "boron",
      boron: "boron",
      
      // Environmental factors
      moisture: "soilMoisture",
      soil_moisture: "soilMoisture",
      soilmoisture: "soilMoisture",
      water_content: "soilMoisture",
      watercontent: "soilMoisture",
      
      temperature: "temperature",
      temp: "temperature",
      soil_temp: "temperature",
      soiltemp: "temperature",
      
      humidity: "humidity",
      relative_humidity: "humidity",
      relativehumidity: "humidity",
      
      rainfall: "rainfall",
      rain: "rainfall",
      precipitation: "rainfall",
      
      // Productivity related (if present in dataset)
      productivity: "productivityScore",
      productivity_score: "productivityScore",
      yield: "productivityScore",
      crop_yield: "productivityScore",
      
      // Soil type (if present)
      soil_type: "soilType",
      soiltype: "soilType",
      texture: "soilType",
      
      // Location (if present)
      location: "location",
      site: "location",
      plot: "location",
    }

    const samples: SoilSample[] = []

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim()
      if (!line) continue // Skip empty lines
      
      // Simple CSV parsing - handle quoted values
      const values: string[] = []
      let currentValue = ''
      let inQuotes = false
      
      for (let j = 0; j < line.length; j++) {
        const char = line[j]
        
        if (char === '"') {
          inQuotes = !inQuotes
        } else if (char === delimiter && !inQuotes) {
          values.push(currentValue.trim())
          currentValue = ''
        } else {
          currentValue += char
        }
      }
      values.push(currentValue.trim()) // Add last value
      
      if (values.length < headers.length) continue

      const sample: Partial<SoilSample> = {
        id: `sample-${i}`,
      }

      headers.forEach((header, idx) => {
        const mappedField = fieldMap[header]
        if (mappedField && mappedField !== "id") {
          const value = Number.parseFloat(values[idx])
          if (!isNaN(value)) {
            ;(sample as Record<string, number | string>)[mappedField] = value
          } else if (values[idx] && typeof values[idx] === 'string') {
            // Handle string values like soil type, location
            ;(sample as Record<string, number | string>)[mappedField] = values[idx]
          }
        }
      })

      // Set intelligent defaults for missing values based on agricultural standards
      sample.nitrogen = sample.nitrogen ?? 0
      sample.phosphorus = sample.phosphorus ?? 0
      sample.potassium = sample.potassium ?? 0
      sample.ph = sample.ph ?? 6.5  // Neutral soil pH
      sample.organicCarbon = sample.organicCarbon ?? 0.5  // Low organic carbon
      sample.electricalConductivity = sample.electricalConductivity ?? 1.0  // Normal EC
      sample.sulphur = sample.sulphur ?? 0
      sample.zinc = sample.zinc ?? 0
      sample.iron = sample.iron ?? 0
      sample.copper = sample.copper ?? 0
      sample.manganese = sample.manganese ?? 0
      sample.boron = sample.boron ?? 0
      sample.soilMoisture = sample.soilMoisture ?? 60  // Moderate moisture
      sample.temperature = sample.temperature ?? 25  // Room temperature
      sample.humidity = sample.humidity ?? 50  // Moderate humidity
      sample.rainfall = sample.rainfall ?? 100  // Moderate rainfall

      samples.push(sample as SoilSample)
    }

    return samples
  }

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0]
      if (!file) return

      setUploadedFile(file)
      setIsProcessing(true)
      setError(null)
      setUploadProgress(0)

      try {
        // Check backend availability first
        const health = await checkBackendHealth()
        const useBackend = health !== null && health.model_loaded

        if (useBackend) {
          setBackendAvailable(true)
          // Use backend API for prediction
          setUploadProgress(20)
          toast({
            title: "Processing",
            description: "Using backend ML model for prediction...",
          })

          const result = await predictFromFile(file)
          setUploadProgress(90)

          const stats = calculateStats(result.data)
          onDataLoaded(result.data, stats)
          setUploadProgress(100)
          toast({
            title: "Success",
            description: `Successfully processed ${result.data.length} samples with ML predictions (Avg: ${result.averageProductivity.toFixed(1)})`,
          })
        } else {
          setBackendAvailable(false)
          // Fallback to client-side parsing
          toast({
            title: "Warning",
            description: "Backend unavailable, using client-side processing",
            variant: "destructive",
          })
          const progressInterval = setInterval(() => {
            setUploadProgress((prev) => Math.min(prev + 10, 90))
          }, 100)

          let text: string
          
          // Handle different file types
          if (file.name.endsWith('.csv')) {
            text = await file.text()
          } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
            text = await parseExcel(file)
          } else {
            throw new Error("Unsupported file format. Please use CSV, XLS, or XLSX files.")
          }
          
          // Detect and show columns found in the dataset
          const columnInfo = detectColumns(text)
          console.log("Detected columns:", columnInfo.detected)
          console.log("Mapped columns:", columnInfo.mapped)
          if (columnInfo.unmapped.length > 0) {
            console.log("Unmapped columns:", columnInfo.unmapped)
            toast({
              title: "Dataset Info",
              description: `Found ${columnInfo.mapped.length} mapped columns. ${columnInfo.unmapped.length} columns were not recognized.`,
              variant: "default",
            })
          }
          
          const data = parseCSV(text)

          clearInterval(progressInterval)
          setUploadProgress(100)

          if (data.length === 0) {
            throw new Error("No valid data found in the file")
          }

          const stats = calculateStats(data)
          onDataLoaded(data, stats)
          toast({
            title: "Success",
            description: `Successfully loaded ${data.length} soil samples`,
          })
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to process file")
        toast({
          title: "Error",
          description: err instanceof Error ? err.message : "Failed to process file",
          variant: "destructive",
        })
      } finally {
        setIsProcessing(false)
      }
    },
    [onDataLoaded],
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "text/csv": [".csv"],
      "application/vnd.ms-excel": [".xls"],
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
    },
    multiple: false,
  })

  const clearUpload = () => {
    setUploadedFile(null)
    setUploadProgress(0)
    setError(null)
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="w-5 h-5 text-primary" />
          Upload Soil Dataset
        </CardTitle>
        <CardDescription>Upload your CSV file containing soil parameters (N, P, K, pH, etc.)</CardDescription>
      </CardHeader>
      <CardContent>
        {!uploadedFile ? (
          <div
            {...getRootProps()}
            className={`
              border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
              ${
                isDragActive
                  ? "border-primary bg-primary/10"
                  : "border-border hover:border-primary/50 hover:bg-muted/50"
              }
            `}
          >
            <input {...getInputProps()} />
            <FileSpreadsheet className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-foreground font-medium mb-1">
              {isDragActive ? "Drop the file here" : "Drag & drop your dataset"}
            </p>
            <p className="text-sm text-muted-foreground">or click to browse (CSV, XLS, XLSX)</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div className="flex items-center gap-3">
                <FileSpreadsheet className="w-8 h-8 text-primary" />
                <div>
                  <p className="font-medium text-foreground">{uploadedFile.name}</p>
                  <p className="text-sm text-muted-foreground">{(uploadedFile.size / 1024).toFixed(1)} KB</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {uploadProgress === 100 && !error && (
                  <Badge variant="secondary" className="bg-primary/20 text-primary">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Processed
                  </Badge>
                )}
                {error && (
                  <Badge variant="destructive">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    Error
                  </Badge>
                )}
                <Button variant="ghost" size="icon" onClick={clearUpload}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {isProcessing && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Processing...</span>
                  <span className="text-foreground">{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="h-2" />
              </div>
            )}

            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
        )}

        <div className="mt-6 space-y-4">
          <div className="p-4 bg-muted/50 rounded-lg">
            <p className="text-sm font-medium text-foreground mb-2">Expected columns:</p>
            <div className="flex flex-wrap gap-2">
              {[
                "N",
                "P",
                "K",
                "pH",
                "OC",
                "EC",
                "S",
                "Zn",
                "Fe",
                "Cu",
                "Mn",
                "B",
                "Moisture",
                "Temp",
                "Humidity",
                "Rainfall",
              ].map((col) => (
                <Badge key={col} variant="outline" className="text-xs">
                  {col}
                </Badge>
              ))}
            </div>
          </div>
          {backendAvailable !== null && (
            <div className="p-3 rounded-lg bg-muted/30">
              <p className="text-xs text-muted-foreground">
                {backendAvailable ? (
                  <span className="text-green-600 dark:text-green-400">
                    ✓ Connected to backend ML model
                  </span>
                ) : (
                  <span className="text-yellow-600 dark:text-yellow-400">
                    ⚠ Using client-side processing (backend unavailable)
                  </span>
                )}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
