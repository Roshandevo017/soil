import type { SoilSample, ClusterResult, PredictionResult, DatasetStats } from "./types"

// Global store for soil data
let soilData: SoilSample[] = []
let clusterResults: ClusterResult[] = []
let predictionResults: PredictionResult[] = []
let datasetStats: DatasetStats | null = null

export const soilDataStore = {
  getData: () => soilData,
  setData: (data: SoilSample[]) => {
    soilData = data
  },
  getClusters: () => clusterResults,
  setClusters: (clusters: ClusterResult[]) => {
    clusterResults = clusters
  },
  getPredictions: () => predictionResults,
  setPredictions: (predictions: PredictionResult[]) => {
    predictionResults = predictions
  },
  getStats: () => datasetStats,
  setStats: (stats: DatasetStats | null) => {
    datasetStats = stats
  },
  clear: () => {
    soilData = []
    clusterResults = []
    predictionResults = []
    datasetStats = null
  },
}
