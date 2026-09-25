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

    if (password.length < 8) {
      return jsonError('Password must be at least 8 characters', 400);
    }

    // Call backend signup endpoint
    const backendResponse = await fetch(`${getBackendUrl()}/api/auth/signup`, {
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

    // After successful signup, automatically log in the user
    const loginResponse = await fetch(`${getBackendUrl()}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...clientIpHeaders(request),
      },
      body: JSON.stringify({ email, password }),
    });

    if (loginResponse.ok) {
      const loginData = await loginResponse.json();
      const token = loginData.token;

      if (token) {
        // Set httpOnly cookie with secure settings
        const cookieStore = await cookies();
        cookieStore.set('rumi_token', token, sessionCookieOptions());
      }
    }

    // Return success response
    return NextResponse.json({ success: true });
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : 'Failed to process signup',
      500
    );
  }
}
