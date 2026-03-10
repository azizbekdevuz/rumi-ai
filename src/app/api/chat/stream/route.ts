import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { ChatRequest, HistoryTurn } from '../../../../types/chat';
import { jsonError, parseBackendError } from '@/lib/api/bff';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';
export const runtime = 'nodejs';

/** Build the backend-shaped payload from the frontend request */
function buildBackendPayload(body: ChatRequest): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    question: body.message,
    language: body.language,
    source_scope: body.sourceScope,
  };
  if (body.sessionId) {
    payload.session_id = body.sessionId;
  }
  if (body.history && body.history.length > 0) {
    payload.history = body.history.slice(-6).map((h: HistoryTurn) => ({
      role: h.role,
      content: h.content,
    }));
  }
  return payload;
}

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json();

    // Get auth token from cookie
    const cookieStore = await cookies();
    const token = cookieStore.get('rumi_token')?.value;

    // Prepare headers
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Call backend streaming endpoint
    const backendResponse = await fetch(`${BACKEND_URL}/api/chat/stream`, {
      method: 'POST',
      headers,
      body: JSON.stringify(buildBackendPayload(body)),
    });

    if (!backendResponse.ok) {
      const errorMessage = await parseBackendError(backendResponse);
      return jsonError(errorMessage, 502);
    }

    // Return streaming response
    return new Response(backendResponse.body, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : 'Failed to start stream',
      500
    );
  }
}
