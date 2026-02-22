/**
 * stream-chat — isolated helper for SSE-based chat streaming.
 *
 * Reads events from the `/api/chat/stream` BFF route and calls
 * typed callbacks as chunks arrive.  Handles the three event types
 * emitted by the backend: "chunk", "done", "error".
 */

import type {
  AssistantMessage,
  Citation,
  HistoryTurn,
  RetrievedCandidate,
  SourceScope,
} from '@/types/chat';

// ── Public types ────────────────────────────────────────────────

export interface StreamChatParams {
  message: string;
  language: string;
  sourceScope: SourceScope;
  sessionId?: string;
  history?: HistoryTurn[];
}

/** The data returned in the `onComplete` callback, including session metadata */
export type StreamCompleteData = Omit<AssistantMessage, 'id' | 'timestamp'> & {
  sessionId?: string;
};

export interface StreamCallbacks {
  /** Called for each progressive text fragment */
  onChunk: (text: string) => void;
  /** Called once when streaming finishes successfully */
  onComplete: (message: StreamCompleteData) => void;
  /** Called if the stream or backend reports an error */
  onError: (error: string) => void;
}

// ── Main function ───────────────────────────────────────────────

export async function streamChat(
  params: StreamChatParams,
  callbacks: StreamCallbacks,
): Promise<void> {
  const { onChunk, onComplete, onError } = callbacks;

  let response: Response;
  try {
    response = await fetch('/api/chat/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: params.message,
        language: params.language,
        sourceScope: params.sourceScope,
        sessionId: params.sessionId,
        history: params.history,
      }),
    });
  } catch {
    onError('Network error — could not reach the server');
    return;
  }

  if (!response.ok || !response.body) {
    onError(`Server error (${response.status})`);
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let accumulatedText = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // SSE lines end with \n\n — process complete events
      const events = buffer.split('\n\n');
      buffer = events.pop() ?? ''; // keep incomplete tail in buffer

      for (const event of events) {
        const parsed = parseSSEEvent(event);
        if (!parsed) continue;

        switch (parsed.type) {
          case 'chunk': {
            const chunkText = typeof parsed.text === 'string' ? parsed.text : '';
            accumulatedText += chunkText;
            onChunk(chunkText);
            break;
          }
          case 'done':
            onComplete(transformDoneEvent(parsed, accumulatedText));
            return;

          case 'error': {
            const errMsg = typeof parsed.message === 'string'
              ? parsed.message
              : 'Unknown streaming error';
            onError(errMsg);
            return;
          }
        }
      }
    }

    // Stream ended without a "done" event — treat accumulated text as the response
    if (accumulatedText) {
      onComplete(buildFallbackMessage(accumulatedText));
    }
  } catch (err) {
    onError(err instanceof Error ? err.message : 'Streaming interrupted');
  } finally {
    reader.releaseLock();
  }
}

// ── Internal helpers ────────────────────────────────────────────

/** Parse a single SSE event block into a typed object */
function parseSSEEvent(raw: string): Record<string, unknown> | null {
  const dataLine = raw
    .split('\n')
    .find((line) => line.startsWith('data: '));

  if (!dataLine) return null;
  try {
    return JSON.parse(dataLine.slice(6));
  } catch {
    return null;
  }
}

/** Map the backend "done" payload to a frontend AssistantMessage shape */
function transformDoneEvent(
  data: Record<string, unknown>,
  accumulatedText: string,
): StreamCompleteData {
  const verse = (data.verse as Record<string, string>) ?? {};
  const rawAdvice = data.advice;

  // advice: backend string → frontend string[]
  let adviceArray: string[];
  if (Array.isArray(rawAdvice)) {
    adviceArray = rawAdvice.map(String).filter(Boolean);
  } else if (typeof rawAdvice === 'string' && rawAdvice.trim()) {
    adviceArray = rawAdvice
      .split(/\r?\n+/)
      .map((l) => l.replace(/^\s*[-•*]\s+/, '').trim())
      .filter(Boolean);
    if (adviceArray.length === 0) adviceArray = [rawAdvice.trim()];
  } else {
    adviceArray = [''];
  }

  // citations: backend {id, book, page_number, snippet} → frontend {refId, book, page, snippet}
  const citations: Citation[] = ((data.citations as unknown[]) ?? []).map(
    (c: unknown) => {
      const ci = c as Record<string, unknown>;
      return {
        refId: String(ci.id ?? ''),
        book: String(ci.book ?? ''),
        page: Number(ci.page_number ?? 0),
        snippet: String(ci.snippet ?? ''),
      };
    },
  );

  // retrieved_candidates → retrievedCandidates
  const retrievedCandidates: RetrievedCandidate[] = (
    (data.retrieved_candidates as unknown[]) ?? []
  ).map((c: unknown) => {
    const ci = c as Record<string, unknown>;
    return {
      refId: String(ci.id ?? ''),
      book: String(ci.book ?? ''),
      page: Number(ci.page_number ?? 0),
    };
  });

  return {
    role: 'assistant' as const,
    content: accumulatedText,
    verse: {
      fa: verse.fa ?? '',
      en: verse.en,
      kr: verse.kr,
    },
    interpretation: String(data.interpretation ?? accumulatedText),
    advice: adviceArray,
    citations,
    retrievedCandidates,
    grounded: typeof data.grounded === 'boolean' ? data.grounded : true,
    sessionId: typeof data.session_id === 'string' ? data.session_id : undefined,
  };
}

/** When the stream ends without a "done" event, build a minimal message */
function buildFallbackMessage(
  text: string,
): Omit<AssistantMessage, 'id' | 'timestamp'> {
  return {
    role: 'assistant',
    content: text,
    verse: { fa: '' },
    interpretation: text,
    advice: [''],
    citations: [],
  };
}
