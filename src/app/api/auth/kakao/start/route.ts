import { createOAuthStartHandler } from '@/lib/auth/oauth-factory';
import { readServerEnv } from '@/lib/env/server-env';

export const runtime = 'nodejs';

export const GET = createOAuthStartHandler({
  providerName: 'Kakao',
  clientId: readServerEnv('KAKAO_REST_API_KEY'),
  redirectUri: readServerEnv('KAKAO_REDIRECT_URI'),
  authUrl: 'https://kauth.kakao.com/oauth/authorize',
});
