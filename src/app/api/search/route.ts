import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jsonError, parseBackendError } from '@/lib/api/bff';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const lang = searchParams.get('lang') || 'fa';
    const bookId = searchParams.get('book_id');

    if (!query) {
      return jsonError('Query parameter "q" is required', 400);
    }

    const cookieStore = await cookies();
    const token = cookieStore.get('rumi_token')?.value;

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const url = new URL(`${BACKEND_URL}/api/search`);
    url.searchParams.set('query', query);
    url.searchParams.set('lang', lang);
    if (bookId) {
      url.searchParams.set('book_id', bookId);
    }

    const backendResponse = await fetch(url.toString(), {
      method: 'GET',
      headers,
    });

    if (!backendResponse.ok) {
      const errorMessage = await parseBackendError(backendResponse);
      return jsonError(errorMessage, backendResponse.status);
    }

    const data = await backendResponse.json();
    return NextResponse.json(data);
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : 'Failed to search',
      500
    );
  }
}
