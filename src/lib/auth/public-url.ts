import { readServerEnv } from '@/lib/env/server-env';

type RequestLike = { url: string };

/**
 * Origin used for browser redirects. APP_BASE_URL (required in production)
 * keeps OAuth return paths on the public https host behind a reverse proxy.
 * Without it, local development uses the request URL as before.
 * Forwarded headers are not consulted because clients can set them.
 */
export function publicOrigin(request: RequestLike): string {
  const configured = readServerEnv('APP_BASE_URL');
  if (configured) return configured.replace(/\/$/, '');
  return new URL(request.url).origin;
}

export function publicUrl(request: RequestLike, path: string): URL {
  return new URL(path, `${publicOrigin(request)}/`);
}
