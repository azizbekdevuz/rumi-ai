import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jsonError, parseBackendError } from '@/lib/api/bff';

// Server-only environment variable
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';

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
    const backendResponse = await fetch(`${BACKEND_URL}/api/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    // Handle non-2xx responses
    if (!backendResponse.ok) {
      const errorMessage = await parseBackendError(backendResponse);
      return jsonError(errorMessage, backendResponse.status);
    }

    // After successful signup, automatically log in the user
    const loginResponse = await fetch(`${BACKEND_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (loginResponse.ok) {
      const loginData = await loginResponse.json();
      const token = loginData.token;

      if (token) {
        // Set httpOnly cookie with secure settings
        const cookieStore = await cookies();
        const isProduction = process.env.NODE_ENV === 'production';
        
        cookieStore.set('rumi_token', token, {
          httpOnly: true,
          secure: isProduction,
          sameSite: 'lax',
          path: '/',
          maxAge: 60 * 60 * 24, // 24 hours
        });
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
