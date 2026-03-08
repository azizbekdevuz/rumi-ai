import { createOAuthCallbackHandler } from '@/lib/auth/oauth-factory';

export const runtime = 'nodejs';

export const GET = createOAuthCallbackHandler({
  providerName: 'Google',
  redirectUri: process.env.GOOGLE_REDIRECT_URI,
  backendPath: '/api/auth/google',
  // TODO(auth, follow-up): Preserve a validated internal `next` destination across the Google OAuth flow
  // so users who start auth from pages like `/profile` return there after successful login.
  // Current behavior falls back to `/chat`. When implementing, only allow safe internal paths
  // (for example paths starting with `/` and not containing `//`) and keep `/chat` as the fallback.
});
