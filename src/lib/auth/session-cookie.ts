import { readServerEnv } from '@/lib/env/server-env';

/** Matches the backend JWT lifetime (JWT_EXPIRATION_HOURS default). */
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24;

export function sessionCookieOptions(maxAge: number = SESSION_MAX_AGE_SECONDS) {
  const base = readServerEnv('APP_BASE_URL') ?? '';
  const secure =
    process.env.NODE_ENV === 'production' || base.startsWith('https://');
  return {
    httpOnly: true,
    secure,
    sameSite: 'lax' as const,
    path: '/',
    maxAge,
  };
}
