import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// Server-only environment variable
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';

interface LoginRequest {
  email: string;
  password: string;
}

interface LoginResponse {
  success: boolean;
  message?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: LoginRequest = await request.json();

    // Validate input
    if (!body.email || !body.password) {
      return NextResponse.json(
        { success: false, message: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Call backend login endpoint
    const backendResponse = await fetch(`${BACKEND_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: body.email,
        password: body.password,
      }),
    });

    // Handle non-2xx responses
    if (!backendResponse.ok) {
      const errorData = await backendResponse.json().catch(() => ({ detail: 'Login failed' }));
      return NextResponse.json(
        { success: false, message: errorData.detail || 'Invalid email or password' },
        { status: backendResponse.status }
      );
    }

    const backendData = await backendResponse.json();
    const token = backendData.token;

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'No token received from backend' },
        { status: 500 }
      );
    }

    // Set httpOnly cookie with token
    const cookieStore = await cookies();
    const isProduction = process.env.NODE_ENV === 'production';
    
    cookieStore.set('rumi_token', token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      path: '/',
      // Cookie expires in 24 hours (matching backend JWT expiration)
      maxAge: 60 * 60 * 24,
    });

    // Return success (no token in response body)
    return NextResponse.json({
      success: true,
      message: 'Login successful',
    });
  } catch (error) {
    console.error('Login API route error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to process login request' },
      { status: 500 }
    );
  }
}
