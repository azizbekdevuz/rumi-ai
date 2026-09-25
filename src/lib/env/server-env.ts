/**
 * Server-only environment lookup at call time. Empty or whitespace values
 * are treated as unset so blank Compose interpolations behave like absence.
 */
export function readServerEnv(name: string): string | undefined {
  const value = process.env[name];
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export function isProductionAppEnv(): boolean {
  const appEnv = (readServerEnv('APP_ENV') ?? '').toLowerCase();
  return appEnv === 'production' || appEnv === 'prod';
}
