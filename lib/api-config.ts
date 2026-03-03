// API Configuration
export const API_CONFIG = {
  // Backend URL for Python Flask API
  BACKEND_URL: process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:5000',
  
  // API endpoints
  ENDPOINTS: {
    HEALTH: '/api/health',
    PREDICT: '/api/predict',
    SOIL_TYPES: '/api/soil-types',
  },
  
  // Request timeout in milliseconds
  TIMEOUT: 30000,
}

// Helper function to get backend API URL
export function getBackendUrl(endpoint: string): string {
  return `${API_CONFIG.BACKEND_URL}${endpoint}`;
}

// Helper function to get full API URL (for Next.js API routes)
export function getApiUrl(endpoint: string): string {
  // For client-side requests, use relative URLs to avoid CORS
  if (typeof window !== 'undefined') {
    return endpoint;
  }
  // For server-side requests, use the full URL if provided, or default to localhost
  return process.env.NEXT_PUBLIC_API_URL ? 
    `${process.env.NEXT_PUBLIC_API_URL}${endpoint}` : 
    `http://localhost:3000${endpoint}`;
}
