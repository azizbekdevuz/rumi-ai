import { TRUSTED_CLIENT_IP_HEADERS } from '@/lib/api/server-backend';
import { isProductionAppEnv, readServerEnv } from './server-env';

/**
 * Fail startup when the public web process is marked production but is
 * missing the values required for OAuth redirects and the backend proxy.
 * Local `next dev` does not set APP_ENV=production, so this stays quiet.
 */
export function assertProductionWebEnv(): void {
  if (!isProductionAppEnv()) return;

  const missing: string[] = [];
  if (!readServerEnv('BACKEND_URL')) missing.push('BACKEND_URL');
  const base = readServerEnv('APP_BASE_URL');
  if (!base) missing.push('APP_BASE_URL');
  if (missing.length > 0) {
    throw new Error(
      `Missing required production environment variables: ${missing.join(', ')}`,
    );
  }

  if (!base!.startsWith('https://')) {
    throw new Error('APP_BASE_URL must be an https URL in production');
  }

  const ipHeader = readServerEnv('TRUSTED_CLIENT_IP_HEADER')?.toLowerCase();
  if (ipHeader && !(TRUSTED_CLIENT_IP_HEADERS as readonly string[]).includes(ipHeader)) {
    throw new Error(
      `TRUSTED_CLIENT_IP_HEADER must be one of: ${TRUSTED_CLIENT_IP_HEADERS.join(', ')}`,
    );
  }

  const origin = base!.replace(/\/$/, '');
  for (const key of ['GOOGLE_REDIRECT_URI', 'KAKAO_REDIRECT_URI'] as const) {
    const value = readServerEnv(key);
    if (value && !value.startsWith(`${origin}/`)) {
      throw new Error(`${key} must start with ${origin}/`);
    }
  }
}
