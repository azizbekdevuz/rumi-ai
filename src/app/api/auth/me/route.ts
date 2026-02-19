import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import type { AuthMeResponse } from '@/types/auth';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';

export const runtime = 'nodejs';

const UNAUTHENTICATED: AuthMeResponse = { authenticated: false, user: null };

/**
 * GET /api/auth/me
 *
 * Reads the httpOnly `rumi_token` cookie, forwards it to the backend
 * `GET /api/user/me`, and returns a typed { authenticated, user } payload
 * that the AuthProvider consumes.
 */
export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('rumi_token')?.value;

    if (!token) {
      return NextResponse.json(UNAUTHENTICATED);
    }

    const backendResp = await fetch(`${BACKEND_URL}/api/user/me`, {
      headers: { Authorization: `Bearer ${token}` },
      // Prevent Next.js from caching user data
      cache: 'no-store',
    });

    if (!backendResp.ok) {
      // Token expired / invalid — treat as unauthenticated
      return NextResponse.json(UNAUTHENTICATED);
    }

    const user = await backendResp.json();
    return NextResponse.json({ authenticated: true, user } satisfies AuthMeResponse);
  } catch {
    // Network error reaching backend — fail gracefully
    return NextResponse.json(UNAUTHENTICATED);
  }
}
