import { createOAuthStartHandler } from '@/lib/auth/oauth-factory';

export const runtime = 'nodejs';

export const GET = createOAuthStartHandler({
  providerName: 'Kakao',
  clientId: process.env.KAKAO_REST_API_KEY,
  redirectUri: process.env.KAKAO_REDIRECT_URI,
  authUrl: 'https://kauth.kakao.com/oauth/authorize',
});
