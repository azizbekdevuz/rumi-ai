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
import { clientIpHeaders, getBackendUrl } from '@/lib/api/server-backend';
import { publicUrl } from '@/lib/auth/public-url';
import { sessionCookieOptions } from '@/lib/auth/session-cookie';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

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

function stateCookieOptions(maxAge: number) {
  return sessionCookieOptions(maxAge);
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
        return NextResponse.redirect(publicUrl(request, '/login?error=oauth_config'));
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
      const response = NextResponse.redirect(authUrl.toString());
      response.cookies.set(`${STATE_COOKIE_PREFIX}${state}`, state, stateCookieOptions(STATE_TTL_SECONDS));

      return response;
    } catch (error) {
      console.error(`[${cfg.providerName} OAuth] Start error:`, error);
      return NextResponse.redirect(publicUrl(request, '/login?error=oauth_failed'));
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
        return NextResponse.redirect(publicUrl(request, '/login?error=oauth_denied'));
      }

      // --- CSRF state verification ---
      // Read the per-attempt state cookie (name = prefix + state from URL).
      const { cookies } = await import('next/headers');
      const cookieStore = await cookies();
      const stateCookieName = `${STATE_COOKIE_PREFIX}${state}`;
      const storedState = cookieStore.get(stateCookieName)?.value;

      if (!state || !storedState || state !== storedState) {
        console.error(`[${cfg.providerName} OAuth] State mismatch — possible CSRF attack`);
        return NextResponse.redirect(publicUrl(request, '/login?error=oauth_state_mismatch'));
      }

      if (!code) {
        console.error(`[${cfg.providerName} OAuth] No authorization code received`);
        return NextResponse.redirect(publicUrl(request, '/login?error=oauth_no_code'));
      }

      if (!cfg.redirectUri) {
        console.error(`[${cfg.providerName} OAuth] Missing redirect URI env var`);
        return NextResponse.redirect(publicUrl(request, '/login?error=oauth_config'));
      }

      // Exchange the authorization code for a JWT via the backend (with timeout)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10_000);
      let backendResponse: Response;
      try {
        backendResponse = await fetch(`${getBackendUrl()}${cfg.backendPath}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...clientIpHeaders(request),
          },
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
        return NextResponse.redirect(publicUrl(request, '/login?error=oauth_failed'));
      }
      clearTimeout(timeoutId);

      if (!backendResponse.ok) {
        const errorMessage = await parseBackendError(backendResponse);
        console.error(`[${cfg.providerName} OAuth] Backend error:`, errorMessage);

        if (backendResponse.status === 409) {
          return NextResponse.redirect(
            publicUrl(request, `/login?error=email_exists&message=${encodeURIComponent(errorMessage)}`)
          );
        }

        return NextResponse.redirect(
          publicUrl(request, `/login?error=oauth_failed&message=${encodeURIComponent(errorMessage)}`)
        );
      }

      const backendData = await backendResponse.json();
      const token: string | undefined = backendData.token;

      if (!token) {
        console.error(`[${cfg.providerName} OAuth] No token received from backend`);
        return NextResponse.redirect(publicUrl(request, '/login?error=oauth_no_token'));
      }

      const response = NextResponse.redirect(publicUrl(request, '/chat'));
      // TODO(auth, follow-up): Support carrying a safe internal `next` path through the OAuth start -> callback flow
      // and use it as the post-login redirect target for all providers.
      // This should be implemented centrally here instead of per-provider route duplication.
      // Only allow validated internal relative paths; otherwise fall back to `/chat`.

      // Persist the session JWT
      response.cookies.set('rumi_token', token, sessionCookieOptions());

      // Clear the per-attempt state cookie
      response.cookies.set(stateCookieName, '', stateCookieOptions(0));

      return response;
    } catch (error) {
      console.error(`[${cfg.providerName} OAuth] Callback exception:`, error);
      return NextResponse.redirect(publicUrl(request, '/login?error=oauth_exception'));
    }
  };
}
