import { createOAuthCallbackHandler } from '@/lib/auth/oauth-factory';

export const runtime = 'nodejs';

export const GET = createOAuthCallbackHandler({
  providerName: 'Google',
  redirectUri: process.env.GOOGLE_REDIRECT_URI,
  backendPath: '/api/auth/google',
});
