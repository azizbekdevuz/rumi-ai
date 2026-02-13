import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jsonError, parseBackendError } from '@/lib/api/bff';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';
export const runtime = 'nodejs';

export async function GET(
  request: NextRequest,
  { params }: { params: { bookId: string; page: string } }
) {
  try {
    const { bookId, page } = params;
    const cookieStore = await cookies();
    const token = cookieStore.get('rumi_token')?.value;

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const backendResponse = await fetch(
      `${BACKEND_URL}/api/books/${bookId}/pages/${page}`,
      {
        method: 'GET',
        headers,
      }
    );

    if (!backendResponse.ok) {
      const errorMessage = await parseBackendError(backendResponse);
      return jsonError(errorMessage, backendResponse.status);
    }

    const data = await backendResponse.json();
    return NextResponse.json(data);
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : 'Failed to fetch book page',
      500
    );
  }
}
