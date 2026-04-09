/**
 * Regression test: chat/stream passes through backend status (401/429) instead of 502.
 * Mocks fetch to simulate backend responses.
 */
import type { NextRequest } from 'next/server';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock fetch before importing the route (which uses fetch)
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

// Mock cookies
vi.mock('next/headers', () => ({
  cookies: vi.fn().mockResolvedValue({
    get: () => ({ value: 'test-token' }),
  }),
}));

describe('chat/stream route status passthrough', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('passes through 401 from backend', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      text: () => Promise.resolve(JSON.stringify({ detail: 'Unauthorized' })),
    });

    const { POST } = await import('./route');
    const req = new Request('http://localhost/api/chat/stream', {
      method: 'POST',
      body: JSON.stringify({
        message: 'hi',
        language: 'en',
        country: 'KR',
        sourceScope: 'books',
      }),
    });

    const res = await POST(req as unknown as NextRequest);
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.message).toBe('Unauthorized');
  });

  it('passes through 429 from backend', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 429,
      text: () =>
        Promise.resolve(
          JSON.stringify({ detail: 'Rate limit exceeded' })
        ),
    });

    const { POST } = await import('./route');
    const req = new Request('http://localhost/api/chat/stream', {
      method: 'POST',
      body: JSON.stringify({
        message: 'hi',
        language: 'en',
        country: 'KR',
        sourceScope: 'books',
      }),
    });

    const res = await POST(req as unknown as NextRequest);
    expect(res.status).toBe(429);
    const json = await res.json();
    expect(json.message).toContain('Rate limit');
  });
});
