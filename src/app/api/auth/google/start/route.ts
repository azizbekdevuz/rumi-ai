import { createOAuthStartHandler } from '@/lib/auth/oauth-factory';

export const runtime = 'nodejs';

export const GET = createOAuthStartHandler({
  providerName: 'Google',
  clientId: process.env.GOOGLE_CLIENT_ID,
  redirectUri: process.env.GOOGLE_REDIRECT_URI,
  authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
  scopes: ['openid', 'email', 'profile'],
  extraParams: { access_type: 'online' },
});
