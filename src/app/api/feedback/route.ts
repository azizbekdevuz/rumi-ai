import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jsonError, parseBackendError } from '@/lib/api/bff';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';
export const runtime = 'nodejs';

/** Valid issue_type values accepted by the backend. */
const VALID_TYPES = [
  'general',
  'bug',
  'feature',
  'appreciation',
  'report',
  'up',
  'down',
  'ocr_error',
  'incorrect_translation',
  'incorrect',
  'offensive',
  'other',
] as const;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      chat_session_id,
      message_id,
      type,
      message,
    } = body as {
      chat_session_id?: string;
      message_id?: string;
      type?: string;
      message?: string;
    };

    if (!type || !VALID_TYPES.includes(type as (typeof VALID_TYPES)[number])) {
      return jsonError(
        `Invalid feedback type "${type}". Must be one of: ${VALID_TYPES.join(', ')}`,
        400,
      );
    }

    // Get auth token from cookie
    const cookieStore = await cookies();
    const token = cookieStore.get('rumi_token')?.value;

    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const backendResponse = await fetch(`${BACKEND_URL}/api/feedback`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        session_id: chat_session_id || null,
        message_id: message_id || null,
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
      500,
    );
  }
}
