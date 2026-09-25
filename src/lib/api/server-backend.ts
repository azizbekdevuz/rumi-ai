import { isIP } from 'node:net';
import { readServerEnv } from '@/lib/env/server-env';

const DEV_BACKEND_URL = 'http://localhost:8000';

function isNextBuildPhase(): boolean {
  return process.env.NEXT_PHASE === 'phase-production-build';
}

/**
 * Base URL of the FastAPI process. In production this must be the
 * in-network address (for example http://api:8000), never a public URL.
 */
export function getBackendUrl(): string {
  const configured = readServerEnv('BACKEND_URL')?.replace(/\/$/, '');
  if (configured) return configured;

  const nodeProduction = process.env.NODE_ENV === 'production';
  const appEnv = (readServerEnv('APP_ENV') ?? '').toLowerCase();
  const productionRuntime =
    !isNextBuildPhase() &&
    (nodeProduction || appEnv === 'production' || appEnv === 'prod');

  if (productionRuntime) {
    throw new Error('BACKEND_URL is required in production');
  }
  return DEV_BACKEND_URL;
}

/**
 * Headers that a trusted ingress overwrites with the real client address:
 * Caddy sets X-Real-IP from the TCP peer (deploy/Caddyfile.example), and
 * Cloudflare's edge sets CF-Connecting-IP. X-Forwarded-For is not accepted
 * because proxies append to it and its first entry is client-controlled.
 */
export const TRUSTED_CLIENT_IP_HEADERS = ['x-real-ip', 'cf-connecting-ip'] as const;

export function trustedClientIpHeader(): string | undefined {
  const configured = readServerEnv('TRUSTED_CLIENT_IP_HEADER')?.toLowerCase();
  if (!configured) return undefined;
  return (TRUSTED_CLIENT_IP_HEADERS as readonly string[]).includes(configured)
    ? configured
    : undefined;
}

/**
 * Forward the visitor address so the API can rate-limit per client.
 * Only the header named by TRUSTED_CLIENT_IP_HEADER is read, and only when
 * it holds exactly one valid IP. Unset (local dev) forwards nothing.
 */
export function clientIpHeaders(request: {
  headers: { get(name: string): string | null };
}): Record<string, string> {
  const header = trustedClientIpHeader();
  if (!header) return {};
  const candidate = request.headers.get(header)?.trim() ?? '';
  if (!candidate || isIP(candidate) === 0) return {};
  return { 'X-Forwarded-For': candidate };
}
