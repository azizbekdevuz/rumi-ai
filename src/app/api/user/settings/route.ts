import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jsonError, parseBackendError } from '@/lib/api/bff';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';

export const runtime = 'nodejs';

/**
 * PATCH /api/user/settings
 *
 * Proxies to backend PATCH /api/user/settings with the JWT from cookie.
 * Accepts { preferred_lang?, theme? } — matches backend UserSettingsUpdate.
 */
export async function PATCH(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('rumi_token')?.value;

    if (!token) {
      return jsonError('Not authenticated', 401);
    }

    const body = await request.json();

    const backendResp = await fetch(`${BACKEND_URL}/api/user/settings`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    if (!backendResp.ok) {
      const errorMsg = await parseBackendError(backendResp);
      return jsonError(errorMsg, backendResp.status);
    }

    const data = await backendResp.json();
    return NextResponse.json({ success: true, ...data });
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : 'Failed to update settings',
      500,
    );
  }
}
