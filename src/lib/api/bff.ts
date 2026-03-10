import { NextResponse } from 'next/server';
import { extractErrorMessage } from './error-utils';

/**
 * Create a standardized JSON error response
 */
export function jsonError(message: string, status: number = 500): NextResponse {
  return NextResponse.json(
    { success: false, message },
    { status }
  );
}

/**
 * Parse error from backend response
 */
export async function parseBackendError(resp: Response): Promise<string> {
  try {
    const text = await resp.text();
    if (!text) return 'Backend request failed';
    try {
      const errorData = JSON.parse(text);
      return extractErrorMessage(errorData, 'Backend request failed');
    } catch {
      return text;
    }
  } catch {
    return 'Backend request failed';
  }
}
