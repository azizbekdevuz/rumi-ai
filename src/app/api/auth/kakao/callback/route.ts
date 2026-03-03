import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jsonError, parseBackendError } from '@/lib/api/bff';

// Server-only environment variables
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';
const KAKAO_REDIRECT_URI = process.env.KAKAO_REDIRECT_URI;

// Ensure Node.js runtime for cookie support
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    // Handle OAuth errors from Kakao
    if (error) {
      console.error('[Kakao OAuth] Callback error:', error);
      return NextResponse.redirect(new URL('/login?error=oauth_denied', request.url));
    }

    if (!code) {
      console.error('[Kakao OAuth] No authorization code received');
      return NextResponse.redirect(new URL('/login?error=oauth_no_code', request.url));
    }

    if (!KAKAO_REDIRECT_URI) {
      console.error('[Kakao OAuth] Missing KAKAO_REDIRECT_URI');
      return NextResponse.redirect(new URL('/login?error=oauth_config', request.url));
    }

    // Call backend to exchange code for token
    const backendResponse = await fetch(`${BACKEND_URL}/api/auth/kakao`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code,
        redirect_uri: KAKAO_REDIRECT_URI,
      }),
    });

    // Handle non-2xx responses
    if (!backendResponse.ok) {
      const errorMessage = await parseBackendError(backendResponse);
      console.error('[Kakao OAuth] Backend error:', errorMessage);
      
      // Handle 409 conflict (email already registered)
      if (backendResponse.status === 409) {
        return NextResponse.redirect(new URL(`/login?error=email_exists&message=${encodeURIComponent(errorMessage)}`, request.url));
      }
      
      return NextResponse.redirect(new URL(`/login?error=oauth_failed&message=${encodeURIComponent(errorMessage)}`, request.url));
    }

    // Parse backend response to get token
    const backendData = await backendResponse.json();
    const token = backendData.token;

    if (!token) {
      console.error('[Kakao OAuth] No token received from backend');
      return NextResponse.redirect(new URL('/login?error=oauth_no_token', request.url));
    }

    // Set httpOnly cookie with secure settings (exactly like /api/auth/login)
    const cookieStore = await cookies();
    const isProduction = process.env.NODE_ENV === 'production';
    
    cookieStore.set('rumi_token', token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24, // 24 hours (matches backend JWT_EXPIRATION_HOURS default)
    });

    // Redirect to chat page
    return NextResponse.redirect(new URL('/chat', request.url));
  } catch (error) {
    console.error('[Kakao OAuth] Callback exception:', error);
    return NextResponse.redirect(new URL('/login?error=oauth_exception', request.url));
  }
}
