import { NextRequest, NextResponse } from 'next/server';

// Server-only environment variables
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI;

// Ensure Node.js runtime
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    if (!GOOGLE_CLIENT_ID || !GOOGLE_REDIRECT_URI) {
      console.error('[Google OAuth] Missing environment variables');
      return NextResponse.redirect(new URL('/login?error=oauth_config', request.url));
    }

    // Build Google OAuth authorization URL
    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('client_id', GOOGLE_CLIENT_ID);
    authUrl.searchParams.set('redirect_uri', GOOGLE_REDIRECT_URI);
    authUrl.searchParams.set('scope', 'openid email profile');
    authUrl.searchParams.set('access_type', 'online');

    // Redirect to Google authorization page
    return NextResponse.redirect(authUrl.toString());
  } catch (error) {
    console.error('[Google OAuth] Start error:', error);
    return NextResponse.redirect(new URL('/login?error=oauth_failed', request.url));
  }
}
