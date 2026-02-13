import { NextRequest, NextResponse } from 'next/server';
import { ChatRequest, ChatResponse } from '../../../types/chat';
import { cookies } from 'next/headers';
import { jsonError, parseBackendError } from '@/lib/api/bff';

// Server-only environment variable
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';

// Ensure Node.js runtime for cookie support
export const runtime = 'nodejs';

/**
 * Transform frontend ChatRequest to backend ChatRequest
 */
function transformRequest(frontendRequest: ChatRequest) {
  return {
    question: frontendRequest.message,
    language: frontendRequest.language,
    source_scope: frontendRequest.sourceScope,
  };
}

/**
 * Transform backend ChatResponse to frontend ChatResponse
 */
function transformResponse(backendResponse: any): ChatResponse {
  // Transform advice: backend returns string, frontend expects string[]
  // Safer parsing: split on newlines, strip leading bullets only
  const raw = backendResponse.advice;
  let adviceArray: string[] = [];

  if (Array.isArray(raw)) {
    adviceArray = raw.map(String).map(s => s.trim()).filter(Boolean);
  } else if (typeof raw === "string") {
    adviceArray = raw
      .split(/\r?\n+/)
      .map(line => line.replace(/^\s*[-•*]\s+/, "").trim())
      .filter(Boolean);
    if (adviceArray.length === 0) adviceArray = [raw.trim()];
  } else if (raw != null) {
    adviceArray = [String(raw).trim()].filter(Boolean);
  }

  if (adviceArray.length === 0) adviceArray = [""];

  // Transform citations: map backend fields to frontend fields
  // Only include refId (not id) as per frontend type
  const citations = (backendResponse.citations || []).map((citation: any) => ({
    refId: citation.id || '',
    page: citation.page_number || 0,
    book: citation.book || '',
    snippet: citation.snippet || '',
  }));

  return {
    id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    verse: {
      fa: backendResponse.verse?.fa || '',
      en: backendResponse.verse?.en,
      kr: backendResponse.verse?.kr,
    },
    interpretation: backendResponse.interpretation || '',
    advice: adviceArray,
    citations: citations,
    retrievedCandidates: (backendResponse.retrieved_candidates || []).map((candidate: any) => ({
      refId: candidate.id || candidate.ref_id || '',
      book: candidate.book || '',
      page: candidate.page_number || 0,
    })),
  };
}

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json();
    console.log('[BFF Chat] Request received:', { message: body.message?.substring(0, 50), language: body.language });

    // Transform frontend request to backend format
    const backendRequest = transformRequest(body);
    console.log('[BFF Chat] Backend request:', backendRequest);

    // Get auth token from httpOnly cookie
    const cookieStore = await cookies();
    const token = cookieStore.get('rumi_token')?.value;
    console.log('[BFF Chat] Token present:', !!token);

    // Prepare headers for backend request
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    // Add Authorization header if token exists
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Call backend API
    const backendUrl = `${BACKEND_URL}/api/chat`;
    console.log('[BFF Chat] Calling backend:', backendUrl);
    console.log('[BFF Chat] BACKEND_URL env:', process.env.BACKEND_URL || 'NOT SET (using default)');
    
    const backendResponse = await fetch(backendUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(backendRequest),
    });

    console.log('[BFF Chat] Backend response status:', backendResponse.status);

    // Handle non-2xx responses
    if (!backendResponse.ok) {
      const errorMessage = await parseBackendError(backendResponse);
      console.log('[BFF Chat] Backend error:', errorMessage);
      return jsonError(errorMessage, 502);
    }

    // Parse backend response
    const backendData = await backendResponse.json();
    console.log('[BFF Chat] Backend response keys:', Object.keys(backendData));
    console.log('[BFF Chat] Backend advice (first 100 chars):', backendData.advice?.substring(0, 100));

    // Transform backend response to frontend format
    const frontendResponse = transformResponse(backendData);
    console.log('[BFF Chat] Frontend response prepared, advice array length:', frontendResponse.advice.length);

    return NextResponse.json(frontendResponse);
  } catch (error) {
    console.error('[BFF Chat] Exception:', error);
    return jsonError(
      error instanceof Error ? error.message : 'Failed to process request',
      500
    );
  }
}
