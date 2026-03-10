/**
 * Regression tests for ReportModal payload construction.
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ReportModal from './ReportModal';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

vi.mock('@/lib/i18n/i18n-context', () => ({
  useI18n: () => ({ language: 'en', dir: 'ltr' }),
}));

describe('ReportModal payload', () => {
  beforeEach(() => {
    mockFetch.mockReset();
    mockFetch.mockResolvedValue({ ok: true });
  });

  it('sends chat_session_id when sessionId provided (session-linked)', async () => {
    const sessionId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
    render(
      <ReportModal
        isOpen={true}
        onClose={() => {}}
        messageId="current"
        sessionId={sessionId}
      />
    );

    const textarea = screen.getByPlaceholderText(/describe what's wrong/i);
    fireEvent.change(textarea, { target: { value: 'Wrong' } });
    fireEvent.click(screen.getByRole('button', { name: 'Submit Report' }));

    await vi.waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/feedback',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining(sessionId),
        })
      );
    });

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.chat_session_id).toBe(sessionId);
    expect(body.message_id).toBeUndefined(); // 'current' is not a valid UUID
  });

  it('sends message_id when valid UUID provided', async () => {
    const messageId = 'b2c3d4e5-f6a7-8901-bcde-f12345678901';
    render(
      <ReportModal
        isOpen={true}
        onClose={() => {}}
        messageId={messageId}
      />
    );

    const textarea = screen.getByPlaceholderText(/describe what's wrong/i);
    fireEvent.change(textarea, { target: { value: 'Wrong' } });
    fireEvent.click(screen.getByRole('button', { name: 'Submit Report' }));

    await vi.waitFor(() => {
      expect(mockFetch).toHaveBeenCalled();
    });

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.message_id).toBe(messageId);
  });

  it('sends only type and message for general (no session/message)', async () => {
    render(
      <ReportModal
        isOpen={true}
        onClose={() => {}}
      />
    );

    const textarea = screen.getByPlaceholderText(/describe what's wrong/i);
    fireEvent.change(textarea, { target: { value: 'Bug' } });
    fireEvent.click(screen.getByRole('button', { name: 'Submit Report' }));

    await vi.waitFor(() => {
      expect(mockFetch).toHaveBeenCalled();
    });

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.type).toBeDefined();
    expect(body.message).toBe('Bug');
    expect(body.chat_session_id).toBeUndefined();
    expect(body.message_id).toBeUndefined();
  });
});
