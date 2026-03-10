/**
 * Regression tests for feedback API route payload mapping.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

vi.mock('next/headers', () => ({
  cookies: vi.fn().mockResolvedValue({
    get: () => ({ value: 'test-token' }),
  }),
}));

describe('feedback API route', () => {
  beforeEach(() => {
    mockFetch.mockReset();
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ ticket_id: '123e4567-e89b-12d3-a456-426614174000' }),
    });
  });

  it('forwards chat_session_id as session_id to backend (session-linked)', async () => {
    const sessionId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
    const body = JSON.stringify({
      type: 'report',
      message: 'Wrong answer',
      chat_session_id: sessionId,
    });

    const { POST } = await import('./route');
    const req = new Request('http://localhost/api/feedback', {
      method: 'POST',
      body,
      headers: { 'Content-Type': 'application/json' },
    });

    await POST(req as any);

    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        method: 'POST',
        body: expect.any(String),
      })
    );
    const sentBody = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(sentBody.session_id).toBe(sessionId);
    expect(sentBody.message_id).toBeNull();
  });

  it('forwards message_id to backend (message-specific)', async () => {
    const messageId = 'b2c3d4e5-f6a7-8901-bcde-f12345678901';
    const body = JSON.stringify({
      type: 'incorrect',
      message: 'This is wrong',
      message_id: messageId,
    });

    const { POST } = await import('./route');
    const req = new Request('http://localhost/api/feedback', {
      method: 'POST',
      body,
      headers: { 'Content-Type': 'application/json' },
    });

    await POST(req as any);

    const sentBody = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(sentBody.message_id).toBe(messageId);
  });

  it('sends general feedback with no session/message (message_id NULL)', async () => {
    const body = JSON.stringify({
      type: 'general',
      message: 'Great app!',
    });

    const { POST } = await import('./route');
    const req = new Request('http://localhost/api/feedback', {
      method: 'POST',
      body,
      headers: { 'Content-Type': 'application/json' },
    });

    await POST(req as any);

    const sentBody = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(sentBody.session_id).toBeNull();
    expect(sentBody.message_id).toBeNull();
  });
});
