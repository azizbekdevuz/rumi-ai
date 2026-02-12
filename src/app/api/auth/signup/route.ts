import { NextRequest, NextResponse } from 'next/server';

// Server-only environment variable
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';

interface SignupRequest {
  email: string;
  password: string;
}

interface SignupResponse {
  success: boolean;
  message?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: SignupRequest = await request.json();

    // Validate input
    if (!body.email || !body.password) {
      return NextResponse.json(
        { success: false, message: 'Email and password are required' },
        { status: 400 }
      );
    }

    if (body.password.length < 8) {
      return NextResponse.json(
        { success: false, message: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    // Call backend signup endpoint
    const backendResponse = await fetch(`${BACKEND_URL}/api/auth/signup`, {
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
      const errorData = await backendResponse.json().catch(() => ({ detail: 'Signup failed' }));
      return NextResponse.json(
        { success: false, message: errorData.detail || 'Signup failed' },
        { status: backendResponse.status }
      );
    }

    // Return success
    return NextResponse.json({
      success: true,
      message: 'Account created successfully',
    });
  } catch (error) {
    console.error('Signup API route error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to process signup request' },
      { status: 500 }
    );
  }
}
