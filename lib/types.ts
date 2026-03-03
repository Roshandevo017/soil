export interface SoilSample {
  id: string
  nitrogen: number| null
  phosphorus: number| null
  potassium: number| null
  ph: number| null
  organicCarbon: number| null
  electricalConductivity: number| null
  sulphur: number| null
  zinc: number| null
  iron: number| null
  copper: number| null
  manganese:number| null
  boron: number| null
  soilMoisture: number| null
  temperature: number| null
  humidity: number| null
  rainfall: number| null
  soilType?: string| null
  location?: string| null
  cluster?: number| null
  productivityScore?: number| null
  productivityClass?: "Low" | "Medium" | "High"| null
}

export interface ClusterResult {
  cluster: number
  centroid: number[]
  samples: SoilSample[]
  characteristics: string
  color: string
}

export interface PredictionResult {
  sample: SoilSample
  productivityScore: number
  productivityClass: "Low" | "Medium" | "High"
  recommendations: string[]
  suitablePractices: string[]
  recommendedCrops: string[]
  expectedYieldPotential: {
    category: "Low" | "Moderate" | "High"
    estimatedRange: string
    interpretation: string
  }
  feasibility: "Suitable" | "Conditionally Suitable" | "Not Suitable"
  soilType: string
  confidence: number
}

export interface DatasetStats {
  totalSamples: number
  features: string[]
  summary: {
    [key: string]: {
      min: number
      max: number
      mean: number
      std: number
    }
  }
}
