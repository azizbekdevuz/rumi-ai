import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jsonError, parseBackendError } from '@/lib/api/bff';
import { clientIpHeaders, getBackendUrl } from '@/lib/api/server-backend';
import { sessionCookieOptions } from '@/lib/auth/session-cookie';

// Ensure Node.js runtime for cookie support
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return jsonError('Email and password are required', 400);
    }

    // Call backend login endpoint
    const backendResponse = await fetch(`${getBackendUrl()}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...clientIpHeaders(request),
      },
      body: JSON.stringify({ email, password }),
    });

    // Handle non-2xx responses
    if (!backendResponse.ok) {
      const errorMessage = await parseBackendError(backendResponse);
      return jsonError(errorMessage, backendResponse.status);
    }

    // Parse backend response to get token
    const backendData = await backendResponse.json();
    const token = backendData.token;

    if (!token) {
      return jsonError('No token received from backend', 502);
    }

    // Set httpOnly cookie with secure settings
    const cookieStore = await cookies();
    cookieStore.set('rumi_token', token, sessionCookieOptions());

    // Return success response (no token in response body)
    return NextResponse.json({ success: true });
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : 'Failed to process login',
      500
    );
  }
}
