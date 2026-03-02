import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jsonError, parseBackendError } from '@/lib/api/bff';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';
export const runtime = 'nodejs';

/**
 * GET /api/sessions/:id/messages — list messages for a session.
 * Proxies to backend GET /api/chat/sessions/:id/messages.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const token = cookieStore.get('rumi_token')?.value;

    const headers: HeadersInit = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const resp = await fetch(
      `${BACKEND_URL}/api/chat/sessions/${id}/messages`,
      { headers },
    );

    if (!resp.ok) {
      const msg = await parseBackendError(resp);
      return jsonError(msg, resp.status);
    }

    const data = await resp.json();
    return NextResponse.json(data);
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : 'Failed to fetch messages',
      500,
    );
  }
}
