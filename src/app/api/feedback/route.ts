import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jsonError, parseBackendError } from '@/lib/api/bff';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { chat_session_id, message_id, type, message } = body;

    if (!type || !['up', 'down', 'report'].includes(type)) {
      return jsonError('Invalid feedback type. Must be: up, down, or report', 400);
    }

    // Get auth token from cookie
    const cookieStore = await cookies();
    const token = cookieStore.get('rumi_token')?.value;

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Call backend feedback endpoint
    const backendResponse = await fetch(`${BACKEND_URL}/api/feedback`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        session_id: chat_session_id || undefined,
        message_id: message_id || undefined,
        issue_type: type,
        comment: message || null,
      }),
    });

    if (!backendResponse.ok) {
      const errorMessage = await parseBackendError(backendResponse);
      return jsonError(errorMessage, backendResponse.status);
    }

    const data = await backendResponse.json();
    return NextResponse.json({ success: true, ticket_id: data.ticket_id });
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : 'Failed to submit feedback',
      500
    );
  }
}
