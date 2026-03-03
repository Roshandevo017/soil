import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes
export const maxBodySize = 10485760; // 10mb in bytes

export async function POST(request: Request) {
  try {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:5000';
    
    // Get the request body as FormData if it's a file upload
    const contentType = request.headers.get('content-type') || '';
    
    let body: BodyInit;
    let headers: Record<string, string> = {};
    
    if (contentType.includes('multipart/form-data')) {
      // For file uploads, stream the body directly
      body = request.body || new ReadableStream();
      headers['Content-Type'] = contentType;
    } else {
      // For JSON requests, parse and forward
      const requestData = await request.json();
      body = JSON.stringify(requestData);
      headers['Content-Type'] = 'application/json';
    }
    
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 45000); // 45 second timeout for predictions
    
    // Prepare request options
    const requestOptions: RequestInit = {
      method: 'POST',
      headers,
      cache: 'no-store',
      signal: controller.signal,
    };
    
    // Only add body and duplex if we have a body to send
    if (body) {
      requestOptions.body = body;
      // Add duplex option for streaming requests
      if (contentType.includes('multipart/form-data')) {
        (requestOptions as any).duplex = 'half';
      }
    }
    
    const response = await fetch(`${backendUrl}/api/predict`, requestOptions);

    clearTimeout(timeout);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Backend error response:', errorText);
      return NextResponse.json(
        { 
          error: `Prediction failed: ${errorText}`,
          status: response.status,
          statusText: response.statusText
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Prediction error:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Unknown prediction error',
        type: error?.constructor?.name || 'Unknown'
      },
      { status: 500 }
    );
  }
}
