import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export const maxDuration = 300; // 5 minutes

export async function GET() {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000); // Reduced timeout
    
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:5000';
    
    try {
      const response = await fetch(`${backendUrl}/api/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        return NextResponse.json(
          { 
            status: 'error', 
            message: 'Backend server is not responding correctly',
            model_loaded: false,
            timestamp: new Date().toISOString(),
            service: 'soil-productivity-prediction'
          },
          { status: 503 }
        );
      }

      const data = await response.json();
      return NextResponse.json(data);
    } catch (fetchError) {
      clearTimeout(timeout);
      
      // Handle specific fetch errors silently
      if (fetchError instanceof Error) {
        if (fetchError.name === 'AbortError') {
          return NextResponse.json(
            { 
              status: 'error', 
              message: 'Backend connection timed out',
              model_loaded: false,
              timestamp: new Date().toISOString(),
              service: 'soil-productivity-prediction'
            },
            { status: 503 }
          );
        }
        if (fetchError.message.includes('ECONNREFUSED') || fetchError.message.includes('fetch failed')) {
          return NextResponse.json(
            { 
              status: 'error', 
              message: 'Backend server is not running',
              model_loaded: false,
              timestamp: new Date().toISOString(),
              service: 'soil-productivity-prediction'
            },
            { status: 503 }
          );
        }
      }
      
      return NextResponse.json(
        { 
          status: 'error', 
          message: 'Failed to connect to backend',
          model_loaded: false,
          timestamp: new Date().toISOString(),
          service: 'soil-productivity-prediction'
        },
        { status: 503 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      { 
        status: 'error', 
        message: 'Health check service unavailable',
        model_loaded: false,
        timestamp: new Date().toISOString(),
        service: 'soil-productivity-prediction'
      },
      { status: 500 }
    );
  }
}
