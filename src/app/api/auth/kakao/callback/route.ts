import { createOAuthCallbackHandler } from '@/lib/auth/oauth-factory';

export const runtime = 'nodejs';

export const GET = createOAuthCallbackHandler({
  providerName: 'Kakao',
  redirectUri: process.env.KAKAO_REDIRECT_URI,
  backendPath: '/api/auth/kakao',
});
