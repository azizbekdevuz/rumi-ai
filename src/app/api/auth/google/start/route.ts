import { createOAuthStartHandler } from '@/lib/auth/oauth-factory';
import { readServerEnv } from '@/lib/env/server-env';

export const runtime = 'nodejs';

export const GET = createOAuthStartHandler({
  providerName: 'Google',
  clientId: readServerEnv('GOOGLE_CLIENT_ID'),
  redirectUri: readServerEnv('GOOGLE_REDIRECT_URI'),
  authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
  scopes: ['openid', 'email', 'profile'],
  extraParams: { access_type: 'online' },
});
