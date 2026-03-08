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

const BACKEND_URL = process.env.BACKEND_URL ?? 'http://localhost:8000';

/** Cookie name used to persist the CSRF state value between start → callback. */
const STATE_COOKIE = 'oauth_state';

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
/**
 * Builds cookie options for persisting the OAuth CSRF state.
 *
 * @param isProduction - Set to `true` when running in production; controls the `secure` flag
 * @param maxAge - Cookie lifetime in seconds
 * @returns An options object with `httpOnly: true`, `secure` set to `isProduction`, `sameSite: 'lax'`, `path: '/'`, and the provided `maxAge`
 */

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
 * Create a Next.js GET route handler that initiates an OAuth authorization flow.
 *
 * The generated handler validates the provided configuration, generates a CSRF state
 * token, stores that state in an httpOnly cookie, and redirects the client to the
 * provider's authorization URL with the required query parameters.
 *
 * @param cfg - OAuth start configuration (includes providerName, clientId, redirectUri, authUrl; may include `scopes` and `extraParams`)
 * @returns A GET route handler that sets a short-lived CSRF state cookie and redirects the browser to the provider's authorization page with `response_type=code`, `client_id`, `redirect_uri`, and `state` (plus optional `scope` and extra params)
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

      // Persist the state in a short-lived, httpOnly cookie so the callback
      // route can verify it and reject forged requests.
      const isProduction = process.env.NODE_ENV === 'production';
      const response = NextResponse.redirect(authUrl.toString());
      response.cookies.set(STATE_COOKIE, state, stateCookieOptions(isProduction, STATE_TTL_SECONDS));

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
 * Create a Next.js GET route handler that processes an OAuth callback: verifies the CSRF `state`,
 * exchanges the authorization `code` with the backend, persists the session token in a cookie,
 * clears the state cookie, and redirects the user.
 *
 * @param cfg - Configuration for the callback handler (providerName for logs, redirectUri used during start, and backendPath to POST the authorization code to)
 * @returns A GET route handler function that redirects to `/chat` on successful token exchange or to `/login` with an error query on failure
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
      // Read the state we stored during the start phase from the httpOnly cookie.
      // The Cookies API in Next.js route handlers is read-only for incoming
      // cookies; we clear the state cookie via the response headers below.
      const { cookies } = await import('next/headers');
      const cookieStore = await cookies();
      const storedState = cookieStore.get(STATE_COOKIE)?.value;

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

      // Exchange the authorization code for a JWT via the backend
      const backendResponse = await fetch(`${BACKEND_URL}${cfg.backendPath}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, redirect_uri: cfg.redirectUri }),
      });

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

      // Clear the state cookie — it has served its purpose
      response.cookies.set(STATE_COOKIE, '', stateCookieOptions(isProduction, 0));

      return response;
    } catch (error) {
      console.error(`[${cfg.providerName} OAuth] Callback exception:`, error);
      return NextResponse.redirect(new URL('/login?error=oauth_exception', request.url));
    }
  };
}
