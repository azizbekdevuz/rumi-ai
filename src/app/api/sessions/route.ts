import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jsonError, parseBackendError } from '@/lib/api/bff';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';
export const runtime = 'nodejs';

/**
 * GET /api/sessions — list chat sessions for the current user.
 * Proxies to backend GET /api/chat/sessions.
 */
export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('rumi_token')?.value;

    if (!token) {
      return jsonError('Unauthorized', 401);
    }

    const headers: HeadersInit = { Authorization: `Bearer ${token}` };

    const resp = await fetch(`${BACKEND_URL}/api/chat/sessions?limit=50`, {
      headers,
    });

    if (!resp.ok) {
      const msg = await parseBackendError(resp);
      return jsonError(msg, resp.status);
    }

    const data = await resp.json();
    return NextResponse.json(data);
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : 'Failed to fetch sessions',
      500,
    );
  }
}
