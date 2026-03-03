import { getApiUrl, getBackendUrl, API_CONFIG } from './api-config'
import type { SoilSample, PredictionResult } from './types'

// API Response types
interface HealthResponse {
  status: string
  timestamp: string
  service: string
  model_loaded: boolean
  message?: string
}

interface PredictResponse {
  message: string
  input?: any
  productivity_score: number
  productivity_level?: string
  soil_type?: string
  suitable_agricultural_practices?: string[]
  recommended_crops?: string[]
  expected_yield_potential?: {
    category?: string
    estimated_range?: string
    interpretation?: string
  }
  farming_feasibility?: string
  data?: any[]
  total_records?: number
  average_productivity?: number
  error?: string
}

// Check if backend is available
export async function checkBackendHealth(): Promise<HealthResponse | null> {
  const maxRetries = 2; // Reduced retries to prevent long delays
  const retryDelay = 500; // Reduced delay

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000); // Reduced timeout
      
      // Use the Next.js API route which will proxy to the Python backend
      const response = await fetch(getApiUrl(API_CONFIG.ENDPOINTS.HEALTH), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        // Silently handle failed responses without console errors
        return {
          status: 'error',
          timestamp: new Date().toISOString(),
          service: 'soil-productivity-prediction',
          model_loaded: false,
          message: `Backend returned ${response.status}: ${response.statusText}`
        };
      }

      let data: HealthResponse;
      try {
        const responseText = await response.text();
        data = JSON.parse(responseText);
      } catch (parseError) {
        return {
          status: 'error',
          timestamp: new Date().toISOString(),
          service: 'soil-productivity-prediction',
          model_loaded: false,
          message: 'Invalid response format from backend'
        };
      }
      return data;
    } catch (error) {
      // Silently handle connection errors without console spam
      
      // If this is the last attempt, return the error silently
      if (attempt === maxRetries) {
        if (error instanceof Error && error.name === 'AbortError') {
          return {
            status: 'error',
            timestamp: new Date().toISOString(),
            service: 'soil-productivity-prediction',
            model_loaded: false,
            message: 'Health check timed out'
          };
        }
        if (error instanceof Error && error.name === 'TimeoutError') {
          return {
            status: 'error',
            timestamp: new Date().toISOString(),
            service: 'soil-productivity-prediction',
            model_loaded: false,
            message: 'Health check request timed out'
          };
        }
        if (error instanceof Error && (error.message.includes('fetch failed') || error.message.includes('ECONNREFUSED'))) {
          return {
            status: 'error',
            timestamp: new Date().toISOString(),
            service: 'soil-productivity-prediction',
            model_loaded: false,
            message: 'Backend server is not running'
          };
        }
        return {
          status: 'error',
          timestamp: new Date().toISOString(),
          service: 'soil-productivity-prediction',
          model_loaded: false,
          message: error instanceof Error ? error.message : 'Unknown error during health check'
        };
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, retryDelay));
    }
  }
  
  return null;
}

// Convert backend response to frontend SoilSample format
function convertBackendDataToSoilSample(data: any, index: number): SoilSample {
  return {
    id: data.id || `sample-${index}`,
    nitrogen: data.nitrogen || data.N || 0,
    phosphorus: data.phosphorus || data.P || 0,
    potassium: data.potassium || data.K || 0,
    ph: data.ph || data.pH || 7,
    organicCarbon: data.organic_matter || data.organicCarbon || data.OC || 0,
    electricalConductivity: data.electrical_conductivity || data.electricalConductivity || data.EC || 0,
    sulphur: data.sulphur || data.S || 0,
    zinc: data.zinc || data.Zn || 0,
    iron: data.iron || data.Fe || 0,
    copper: data.copper || data.Cu || 0,
    manganese: data.manganese || data.Mn || 0,
    boron: data.boron || data.B || 0,
    soilMoisture: data.moisture || data.soilMoisture || data.soil_moisture || 50,
    temperature: data.temperature || data.temp || 25,
    humidity: data.humidity || 60,
    rainfall: data.rainfall || data.rain || 100,
    soilType: data.soil_type || data.soilType || data.texture || null,
    productivityScore: data.productivity_score || data.productivityScore,
    productivityClass: data.productivity_level || data.productivityClass,
  }
}

type ProductivityClass = 'High' | 'Medium' | 'Low'

const SOIL_GUIDANCE: Record<string, { practices: string[]; crops: string[] }> = {
  Sandy: {
    practices: [
      'Use drip irrigation with frequent low-volume watering',
      'Add compost or farmyard manure to improve water retention',
      'Apply mulch to reduce evaporation losses',
    ],
    crops: ['Groundnut', 'Watermelon', 'Carrot', 'Millets', 'Cassava'],
  },
  Clay: {
    practices: [
      'Use raised beds and surface drainage to avoid waterlogging',
      'Incorporate organic matter to improve structure and aeration',
      'Limit tillage when soil is wet to prevent compaction',
    ],
    crops: ['Paddy', 'Wheat', 'Cotton', 'Soybean', 'Cabbage'],
  },
  Silt: {
    practices: [
      'Use contour farming or cover crops to reduce erosion',
      'Maintain residue cover after harvest',
      'Apply balanced NPK with split nitrogen dosing',
    ],
    crops: ['Wheat', 'Maize', 'Mustard', 'Potato', 'Pulses'],
  },
  Loam: {
    practices: [
      'Follow crop rotation to maintain long-term fertility',
      'Use integrated nutrient management (organic + inorganic)',
      'Schedule irrigation based on moisture monitoring',
    ],
    crops: ['Rice', 'Wheat', 'Maize', 'Vegetables', 'Sugarcane'],
  },
  Peat: {
    practices: [
      'Improve drainage and avoid prolonged saturation',
      'Apply lime where pH is very low',
      'Use potassium-rich fertilizers and monitor micronutrients',
    ],
    crops: ['Potato', 'Onion', 'Carrot', 'Lettuce', 'Forage grasses'],
  },
  Chalky: {
    practices: [
      'Apply organic matter to improve nutrient availability',
      'Use chelated micronutrients, especially iron and zinc',
      'Use split fertilizer application to reduce nutrient lock-up',
    ],
    crops: ['Barley', 'Spinach', 'Beetroot', 'Cabbage', 'Chickpea'],
  },
  Saline: {
    practices: [
      'Leach salts using good-quality irrigation water',
      'Provide field drainage and avoid standing saline water',
      'Use gypsum where sodicity correction is required',
    ],
    crops: ['Barley', 'Cotton', 'Sorghum', 'Quinoa', 'Salt-tolerant rice'],
  },
}

function inferSoilType(sample: SoilSample): string {
  const ph = sample.ph ?? 7
  const organicCarbon = sample.organicCarbon ?? 0
  const moisture = sample.soilMoisture ?? 50
  const nitrogen = sample.nitrogen ?? 0
  const phosphorus = sample.phosphorus ?? 0
  const potassium = sample.potassium ?? 0

  if (ph > 8.2) return 'Chalky'
  if (ph < 5.5 && organicCarbon > 2.5) return 'Peat'
  if (moisture < 30 && organicCarbon < 1.0 && potassium < 180) return 'Sandy'
  if (moisture > 65 && organicCarbon > 1.5) return 'Clay'
  if (ph >= 7.8 && moisture < 45) return 'Saline'
  if (moisture >= 30 && moisture <= 55 && ph >= 6.0 && ph <= 7.8 && nitrogen + phosphorus + potassium > 320) {
    return 'Loam'
  }
  if (moisture >= 35 && moisture <= 60 && ph >= 6.0 && ph <= 7.5) return 'Silt'
  return 'Loam'
}

function getYieldPotential(score: number): {
  category: 'Low' | 'Moderate' | 'High'
  estimatedRange: string
  interpretation: string
} {
  if (score >= 70) {
    return {
      category: 'High',
      estimatedRange: '4.5-6.5 t/ha',
      interpretation: 'Strong yield outlook under recommended management',
    }
  }
  if (score >= 40) {
    return {
      category: 'Moderate',
      estimatedRange: '2.5-4.5 t/ha',
      interpretation: 'Moderate yield expected; improvements can raise performance',
    }
  }
  return {
    category: 'Low',
    estimatedRange: '1.0-2.5 t/ha',
    interpretation: 'Low yield potential unless soil constraints are corrected',
  }
}

function getFeasibility(productivityClass: ProductivityClass): 'Suitable' | 'Conditionally Suitable' | 'Not Suitable' {
  if (productivityClass === 'High') return 'Suitable'
  if (productivityClass === 'Medium') return 'Conditionally Suitable'
  return 'Not Suitable'
}

function buildSoilIntelligence(
  sample: SoilSample,
  productivityScore: number,
  productivityClass: ProductivityClass,
  backendData?: PredictResponse | any
) {
  const soilType = backendData?.soil_type || backendData?.soilType || sample.soilType || inferSoilType(sample)
  const fallback = SOIL_GUIDANCE[soilType] || SOIL_GUIDANCE.Loam

  const suitablePractices =
    backendData?.suitable_agricultural_practices ||
    backendData?.suitablePractices ||
    fallback.practices

  const recommendedCrops =
    backendData?.recommended_crops ||
    backendData?.recommendedCrops ||
    fallback.crops

  const backendYield = backendData?.expected_yield_potential || backendData?.expectedYieldPotential
  const expectedYieldPotential = backendYield
    ? {
        category: (backendYield.category || 'Moderate') as 'Low' | 'Moderate' | 'High',
        estimatedRange: backendYield.estimated_range || backendYield.estimatedRange || '2.5-4.5 t/ha',
        interpretation:
          backendYield.interpretation || 'Yield potential estimated from soil profile and productivity score',
      }
    : getYieldPotential(productivityScore)

  return {
    soilType,
    suitablePractices,
    recommendedCrops,
    expectedYieldPotential,
    feasibility: (backendData?.farming_feasibility || getFeasibility(productivityClass)) as
      | 'Suitable'
      | 'Conditionally Suitable'
      | 'Not Suitable',
  }
}

// Predict productivity for a single sample (JSON input)
export async function predictSingleSample(sample: SoilSample): Promise<PredictionResult> {
  try {
    // Convert frontend format to backend format
    const requestData = {
      nitrogen: sample.nitrogen,
      phosphorus: sample.phosphorus,
      potassium: sample.potassium,
      ph: sample.ph,
      organic_matter: sample.organicCarbon,
      moisture: sample.soilMoisture,
      temperature: sample.temperature,
    };

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);
    
    const requestOptions = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData),
      cache: 'no-store' as RequestCache,
      signal: controller.signal,
    };
    
    const response = await fetch(getApiUrl(API_CONFIG.ENDPOINTS.PREDICT), requestOptions)

    clearTimeout(timeout);

    if (!response.ok) {
      let errorMessage = `Prediction failed: ${response.statusText}`;
      try {
        const errorText = await response.text();
        // Try to parse as JSON first
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || errorMessage;
        } catch {
          // If not JSON, use the raw text if it's meaningful
          if (errorText && errorText.trim() && !errorText.startsWith('<')) {
            errorMessage = `Prediction failed: ${errorText}`;
          }
        }
      } catch {
        // Use default error message
      }
      throw new Error(errorMessage);
    }

    let result: PredictResponse;
    try {
      const responseText = await response.text();
      result = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Failed to parse response as JSON:', parseError);
      throw new Error('Invalid response format from backend');
    }

    // Convert to frontend format
    const productivityScore = result.productivity_score
    const productivityClass = (result.productivity_level ||
      (productivityScore > 70 ? 'High' : productivityScore > 40 ? 'Medium' : 'Low')) as ProductivityClass
    const intelligence = buildSoilIntelligence(sample, productivityScore, productivityClass, result)

    return {
      sample: {
        ...sample,
        soilType: intelligence.soilType,
        productivityScore,
        productivityClass,
      },
      productivityScore,
      productivityClass,
      recommendations: intelligence.suitablePractices,
      suitablePractices: intelligence.suitablePractices,
      recommendedCrops: intelligence.recommendedCrops,
      expectedYieldPotential: intelligence.expectedYieldPotential,
      feasibility: intelligence.feasibility,
      soilType: intelligence.soilType,
      confidence: 0.85, // Backend doesn't provide confidence, use default
    }
  } catch (error) {
    console.error('Prediction error:', error)
    if (error instanceof Error && (error.name === 'AbortError' || error.name === 'TimeoutError')) {
      throw new Error('Prediction request timed out. Please try again.')
    }
    throw error
  }
}

// Predict productivity for multiple samples (file upload)
export async function predictFromFile(file: File): Promise<{
  data: SoilSample[]
  predictions: PredictionResult[]
  averageProductivity: number
}> {
  try {
    const formData = new FormData()
    formData.append('file', file)

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT * 2);
    
    // Use standard fetch without duplex option
    const response = await fetch(getApiUrl(API_CONFIG.ENDPOINTS.PREDICT), {
      method: 'POST',
      body: formData,
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      let errorMessage = `File prediction failed: ${response.statusText}`;
      try {
        const errorText = await response.text();
        // Try to parse as JSON first
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || errorMessage;
        } catch {
          // If not JSON, use the raw text if it's meaningful
          if (errorText && errorText.trim() && !errorText.startsWith('<')) {
            errorMessage = `File prediction failed: ${errorText}`;
          }
        }
      } catch {
        // Use default error message
      }
      throw new Error(errorMessage);
    }

    let result: PredictResponse;
    try {
      const responseText = await response.text();
      result = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Failed to parse response as JSON:', parseError);
      throw new Error('Invalid response format from backend');
    }

    if (!result.data || result.data.length === 0) {
      throw new Error('No data returned from backend')
    }

    // Convert backend data to frontend format
    const samples: SoilSample[] = result.data.map((item: any, index: number) =>
      convertBackendDataToSoilSample(item, index)
    )

    // Create prediction results
    const predictions: PredictionResult[] = samples.map((sample, index) => {
      const score = sample.productivityScore || 0
      const productivityClass = (sample.productivityClass ||
        (score > 70 ? 'High' : score > 40 ? 'Medium' : 'Low')) as ProductivityClass
      const intelligence = buildSoilIntelligence(sample, score, productivityClass, result.data?.[index])

      return {
        sample: { ...sample, soilType: intelligence.soilType },
        productivityScore: score,
        productivityClass,
        recommendations: intelligence.suitablePractices,
        suitablePractices: intelligence.suitablePractices,
        recommendedCrops: intelligence.recommendedCrops,
        expectedYieldPotential: intelligence.expectedYieldPotential,
        feasibility: intelligence.feasibility,
        soilType: intelligence.soilType,
        confidence: 0.85,
      }
    })

    return {
      data: samples,
      predictions,
      averageProductivity: result.average_productivity || 0,
    }
  } catch (error) {
    console.error('File prediction error:', error)
    if (error instanceof Error) {
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      })
    }
    if (error instanceof Error && (error.name === 'AbortError' || error.name === 'TimeoutError')) {
      throw new Error('File prediction request timed out. Please try again with a smaller file.')
    }
    throw error
  }
}

// Get soil types from backend
export async function getSoilTypes(): Promise<string[]> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);
    
    const response = await fetch(getApiUrl(API_CONFIG.ENDPOINTS.SOIL_TYPES), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
    })

    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`Failed to fetch soil types: ${response.statusText}`)
    }

    try {
      const responseText = await response.text();
      return JSON.parse(responseText);
    } catch (parseError) {
      console.error('Failed to parse soil types response as JSON:', parseError);
      throw new Error('Invalid response format from backend');
    }
  } catch (error) {
    console.error('Failed to fetch soil types:', error)
    if (error instanceof Error && (error.name === 'AbortError' || error.name === 'TimeoutError')) {
      console.warn('Soil types request timed out, using fallback values')
    }
    return ['Loam', 'Clay', 'Sandy', 'Silt', 'Peat'] // Fallback
  }
}
