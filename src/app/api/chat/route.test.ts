/**
 * Regression test: chat (non-streaming) passes through backend status instead of 502.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

vi.mock('next/headers', () => ({
  cookies: vi.fn().mockResolvedValue({
    get: () => ({ value: 'test-token' }),
  }),
}));

describe('chat route status passthrough', () => {
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
    const req = new Request('http://localhost/api/chat', {
      method: 'POST',
      body: JSON.stringify({
        message: 'hi',
        language: 'en',
        country: 'KR',
        sourceScope: 'books',
      }),
    });

    const res = await POST(req as any);
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.message).toBe('Unauthorized');
  });
});
