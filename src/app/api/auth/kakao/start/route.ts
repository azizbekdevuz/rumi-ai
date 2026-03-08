import { NextRequest, NextResponse } from 'next/server';

// Server-only environment variable
const KAKAO_REST_API_KEY = process.env.KAKAO_REST_API_KEY;
const KAKAO_REDIRECT_URI = process.env.KAKAO_REDIRECT_URI;

// Ensure Node.js runtime
export const runtime = 'nodejs';

/**
 * Initiates the Kakao OAuth flow by redirecting the client to Kakao's authorization endpoint.
 *
 * If the required environment variables are not set, redirects to `/login?error=oauth_config`.
 * On unexpected errors, redirects to `/login?error=oauth_failed`.
 *
 * @param request - The incoming NextRequest; used as the base for constructing redirect URLs.
 * @returns A NextResponse that redirects the client to the Kakao authorization URL, or to the login page with an error query parameter when configuration or runtime errors occur.
 */
export async function GET(request: NextRequest) {
  try {
    if (!KAKAO_REST_API_KEY || !KAKAO_REDIRECT_URI) {
      console.error('[Kakao OAuth] Missing environment variables');
      return NextResponse.redirect(new URL('/login?error=oauth_config', request.url));
    }

    // Build Kakao OAuth authorization URL
    const authUrl = new URL('https://kauth.kakao.com/oauth/authorize');
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('client_id', KAKAO_REST_API_KEY);
    authUrl.searchParams.set('redirect_uri', KAKAO_REDIRECT_URI);

    // Redirect to Kakao authorization page
    return NextResponse.redirect(authUrl.toString());
  } catch (error) {
    console.error('[Kakao OAuth] Start error:', error);
    return NextResponse.redirect(new URL('/login?error=oauth_failed', request.url));
  }
}

