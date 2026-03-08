/**
 * OAuth factory helpers.
 *
 * Provides `createOAuthStartHandler` and `createOAuthCallbackHandler` factory
 * functions so individual provider routes (Google, Kakao, …) share one
 * implementation of:
 *   - CSRF state generation / verification (via a short-lived httpOnly cookie)
 *   - Authorization URL construction
 *   - Code → backend-JWT exchange
 *   - Session cookie management
 */
import { randomBytes } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { parseBackendError } from '@/lib/api/bff';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

function getBackendUrl(): string {
  const env = process.env.BACKEND_URL;
  const nodeEnv = process.env.NODE_ENV;
  if (nodeEnv && nodeEnv !== 'development' && !env) {
    throw new Error(
      'BACKEND_URL is required in non-development environments for OAuth callbacks'
    );
  }
  return env ?? 'http://localhost:8000';
}

/** Cookie name prefix for per-attempt CSRF state (full name: prefix + state). */
const STATE_COOKIE_PREFIX = 'oauth_state_';

/** State cookie TTL in seconds — long enough for any reasonable OAuth round-trip. */
const STATE_TTL_SECONDS = 60 * 10; // 10 minutes

// ---------------------------------------------------------------------------
// Config types
// ---------------------------------------------------------------------------

export interface OAuthStartConfig {
  /** Human-readable provider name used in log messages (e.g. 'Google'). */
  providerName: string;
  /** Client / app ID issued by the provider (read from an env var). */
  clientId: string | undefined;
  /** Redirect URI that must be registered with the provider. */
  redirectUri: string | undefined;
  /** Base authorization URL for the provider. */
  authUrl: string;
  /** OAuth scopes to request. Pass an empty array to omit the scope param. */
  scopes?: string[];
  /** Any extra static query params to append (e.g. `{ access_type: 'online' }`). */
  extraParams?: Record<string, string>;
}

export interface OAuthCallbackConfig {
  /** Human-readable provider name used in log messages (e.g. 'Google'). */
  providerName: string;
  /** Redirect URI that was sent to the provider during the start phase. */
  redirectUri: string | undefined;
  /** Backend API path to POST the authorization code to (e.g. '/api/auth/google'). */
  backendPath: string;
}

// ---------------------------------------------------------------------------
// Shared cookie helper
// ---------------------------------------------------------------------------

function stateCookieOptions(isProduction: boolean, maxAge: number) {
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax' as const,
    path: '/',
    maxAge,
  };
}

// ---------------------------------------------------------------------------
// Factory: start handler
// ---------------------------------------------------------------------------

/**
 * Returns a Next.js `GET` route handler that:
 *  1. Validates required env vars.
 *  2. Generates a random CSRF state token and stores it in an httpOnly cookie.
 *  3. Redirects the browser to the provider's authorization page (with state).
 */
export function createOAuthStartHandler(cfg: OAuthStartConfig) {
  return async function GET(request: NextRequest): Promise<NextResponse> {
    try {
      if (!cfg.clientId || !cfg.redirectUri) {
        console.error(`[${cfg.providerName} OAuth] Missing environment variables`);
        return NextResponse.redirect(new URL('/login?error=oauth_config', request.url));
      }

      // Generate an unguessable state value for CSRF protection
      const state = randomBytes(32).toString('hex');

      // Build the provider authorization URL
      const authUrl = new URL(cfg.authUrl);
      authUrl.searchParams.set('response_type', 'code');
      authUrl.searchParams.set('client_id', cfg.clientId);
      authUrl.searchParams.set('redirect_uri', cfg.redirectUri);
      authUrl.searchParams.set('state', state);

      if (cfg.scopes && cfg.scopes.length > 0) {
        authUrl.searchParams.set('scope', cfg.scopes.join(' '));
      }
      for (const [key, value] of Object.entries(cfg.extraParams ?? {})) {
        authUrl.searchParams.set(key, value);
      }

      // Persist the state in a short-lived, httpOnly cookie (per-attempt name)
      // so the callback can verify it and reject forged requests.
      const isProduction = process.env.NODE_ENV === 'production';
      const response = NextResponse.redirect(authUrl.toString());
      response.cookies.set(`${STATE_COOKIE_PREFIX}${state}`, state, stateCookieOptions(isProduction, STATE_TTL_SECONDS));

      return response;
    } catch (error) {
      console.error(`[${cfg.providerName} OAuth] Start error:`, error);
      return NextResponse.redirect(new URL('/login?error=oauth_failed', request.url));
    }
  };
}

// ---------------------------------------------------------------------------
// Factory: callback handler
// ---------------------------------------------------------------------------

/**
 * Returns a Next.js `GET` route handler that:
 *  1. Verifies the `state` query param matches the value in the httpOnly cookie
 *     (CSRF protection).
 *  2. Forwards the authorization `code` to the backend for token exchange.
 *  3. Sets the `rumi_token` session cookie and redirects to `/chat`.
 */
export function createOAuthCallbackHandler(cfg: OAuthCallbackConfig) {
  return async function GET(request: NextRequest): Promise<NextResponse> {
    try {
      const searchParams = request.nextUrl.searchParams;
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const error = searchParams.get('error');

      // Forward any provider-side errors (e.g. user denied access)
      if (error) {
        console.error(`[${cfg.providerName} OAuth] Callback error from provider:`, error);
        return NextResponse.redirect(new URL('/login?error=oauth_denied', request.url));
      }

      // --- CSRF state verification ---
      // Read the per-attempt state cookie (name = prefix + state from URL).
      const { cookies } = await import('next/headers');
      const cookieStore = await cookies();
      const stateCookieName = `${STATE_COOKIE_PREFIX}${state}`;
      const storedState = cookieStore.get(stateCookieName)?.value;

      if (!state || !storedState || state !== storedState) {
        console.error(`[${cfg.providerName} OAuth] State mismatch — possible CSRF attack`);
        return NextResponse.redirect(new URL('/login?error=oauth_state_mismatch', request.url));
      }

      if (!code) {
        console.error(`[${cfg.providerName} OAuth] No authorization code received`);
        return NextResponse.redirect(new URL('/login?error=oauth_no_code', request.url));
      }

      if (!cfg.redirectUri) {
        console.error(`[${cfg.providerName} OAuth] Missing redirect URI env var`);
        return NextResponse.redirect(new URL('/login?error=oauth_config', request.url));
      }

      // Exchange the authorization code for a JWT via the backend (with timeout)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10_000);
      let backendResponse: Response;
      try {
        backendResponse = await fetch(`${getBackendUrl()}${cfg.backendPath}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code, redirect_uri: cfg.redirectUri }),
          signal: controller.signal,
        });
      } catch (err) {
        clearTimeout(timeoutId);
        if (err instanceof Error && err.name === 'AbortError') {
          console.error(`[${cfg.providerName} OAuth] Backend request timed out`);
        } else {
          console.error(`[${cfg.providerName} OAuth] Backend request failed:`, err);
        }
        return NextResponse.redirect(new URL('/login?error=oauth_failed', request.url));
      }
      clearTimeout(timeoutId);

      if (!backendResponse.ok) {
        const errorMessage = await parseBackendError(backendResponse);
        console.error(`[${cfg.providerName} OAuth] Backend error:`, errorMessage);

        if (backendResponse.status === 409) {
          return NextResponse.redirect(
            new URL(`/login?error=email_exists&message=${encodeURIComponent(errorMessage)}`, request.url)
          );
        }

        return NextResponse.redirect(
          new URL(`/login?error=oauth_failed&message=${encodeURIComponent(errorMessage)}`, request.url)
        );
      }

      const backendData = await backendResponse.json();
      const token: string | undefined = backendData.token;

      if (!token) {
        console.error(`[${cfg.providerName} OAuth] No token received from backend`);
        return NextResponse.redirect(new URL('/login?error=oauth_no_token', request.url));
      }

      const isProduction = process.env.NODE_ENV === 'production';
      const response = NextResponse.redirect(new URL('/chat', request.url));

      // Persist the session JWT
      response.cookies.set('rumi_token', token, {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24, // 24 hours — matches backend JWT_EXPIRATION_HOURS
      });

      // Clear the per-attempt state cookie
      response.cookies.set(stateCookieName, '', stateCookieOptions(isProduction, 0));

      return response;
    } catch (error) {
      console.error(`[${cfg.providerName} OAuth] Callback exception:`, error);
      return NextResponse.redirect(new URL('/login?error=oauth_exception', request.url));
    }
  };
}
