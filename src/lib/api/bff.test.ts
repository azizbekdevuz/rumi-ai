import { describe, it, expect, vi, beforeEach } from 'vitest';
import { parseBackendError } from './bff';

describe('parseBackendError', () => {
  function mockResponse(body: string, ok = false): Response {
    return {
      ok,
      text: vi.fn().mockResolvedValue(body),
      json: vi.fn(),
    } as unknown as Response;
  }

  it('extracts message from JSON with detail', async () => {
    const resp = mockResponse(JSON.stringify({ detail: 'Invalid token' }));
    expect(await parseBackendError(resp)).toBe('Invalid token');
  });

  it('extracts message from JSON with error.message', async () => {
    const resp = mockResponse(
      JSON.stringify({ error: { message: 'Rate limit exceeded' } })
    );
    expect(await parseBackendError(resp)).toBe('Rate limit exceeded');
  });

  it('returns plain text when body is not JSON', async () => {
    const resp = mockResponse('Plain error message');
    expect(await parseBackendError(resp)).toBe('Plain error message');
  });

  it('returns fallback when body is empty', async () => {
    const resp = mockResponse('');
    expect(await parseBackendError(resp)).toBe('Backend request failed');
  });

  it('returns fallback when text() throws', async () => {
    const resp = {
      text: vi.fn().mockRejectedValue(new Error('Stream consumed')),
    } as unknown as Response;
    expect(await parseBackendError(resp)).toBe('Backend request failed');
  });

  it('returns fallback for invalid JSON that is not plain text', async () => {
    const resp = mockResponse('{invalid json');
    expect(await parseBackendError(resp)).toBe('{invalid json');
  });
});
