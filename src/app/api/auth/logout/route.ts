import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jsonError } from '@/lib/api/bff';
import { sessionCookieOptions } from '@/lib/auth/session-cookie';

// Ensure Node.js runtime for cookie support
export const runtime = 'nodejs';

export async function POST() {
  try {
    const cookieStore = await cookies();
    cookieStore.set('rumi_token', '', sessionCookieOptions(0));
    return NextResponse.json({ success: true });
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : 'Failed to process logout',
      500
    );
  }
}
