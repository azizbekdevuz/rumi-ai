export async function register() {
  if (process.env.NEXT_RUNTIME && process.env.NEXT_RUNTIME !== 'nodejs') return;
  if (process.env.NEXT_PHASE === 'phase-production-build') return;

  const { assertProductionWebEnv } = await import('@/lib/env/production');
  assertProductionWebEnv();
}
