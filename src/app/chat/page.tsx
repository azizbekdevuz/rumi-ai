'use client';

import { Suspense, useState, useCallback, useRef, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useI18n } from '@/lib/i18n/i18n-context';
import {
  ChatMessage as ChatMessageType,
  AssistantMessage,
  SourceScope,
  Citation,
  HistoryTurn,
} from '../../types/chat';
import { streamChat, StreamCompleteData } from '@/lib/api/stream-chat';
import CitationModal from '@/features/chat/components/CitationModal';
import ReportModal from '@/features/chat/components/ReportModal';
import SuggestedPrompts from '@/features/chat/components/SuggestedPrompts';
import ChatPageShell from '@/features/chat/components/ChatPageShell';
import ChatPanel from '@/features/chat/components/ChatPanel';
import ChatHeader from '@/features/chat/components/ChatHeader';
import ChatHistoryDrawer from '@/features/chat/components/ChatHistoryDrawer';
import MessageList from '@/features/chat/components/MessageList';
import Composer from '@/features/chat/components/Composer';
import UtilityBar from '@/features/chat/components/UtilityBar';
import { motion, AnimatePresence } from 'framer-motion';
import { motion as motionTokens } from '@/lib/design-system/motion';
import { useReducedMotion } from '@/lib/hooks';
import { MsgSquareIcon } from '@/components/ui/icons';

// ── Session persistence helpers ───────────────────────────────────

const SESSION_KEY = 'rumi_chat_session_id';

function loadSessionId(): string | undefined {
  if (typeof window === 'undefined') return undefined;
  return localStorage.getItem(SESSION_KEY) ?? undefined;
}

function saveSessionId(id: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(SESSION_KEY, id);
  }
}

// ── History builder ───────────────────────────────────────────────

/** Build a bounded (max 6 turns) history payload from existing messages */
function buildHistory(messages: ChatMessageType[]): HistoryTurn[] {
  return messages
    .filter((m) => m.content.trim())
    .slice(-6)
    .map((m) => ({ role: m.role, content: m.content }));
}

export default function ChatPage() {
  return (
    <Suspense fallback={null}>
      <ChatPageContent />
    </Suspense>
  );
}

function ChatPageContent() {
  const { language, t } = useI18n();
  const searchParams = useSearchParams();
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sourceScope, setSourceScope] = useState<SourceScope>('books');
  const [citeEnabled, setCiteEnabled] = useState(true);
  const [selectedCitation, setSelectedCitation] = useState<Citation | null>(null);
  const [reportMessageId, setReportMessageId] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | undefined>(undefined);
  const [historyOpen, setHistoryOpen] = useState(false);
  const reducedMotion = useReducedMotion();

  // Ref to track the ID of the currently streaming assistant message
  const streamingIdRef = useRef<string | null>(null);
  // Track whether we already loaded a session from query param
  const sessionLoadedRef = useRef(false);

  // Restore session id from localStorage on mount OR load from ?session= param
  useEffect(() => {
    const querySession = searchParams.get('session');
    if (querySession && !sessionLoadedRef.current) {
      sessionLoadedRef.current = true;
      setSessionId(querySession);
      saveSessionId(querySession);
      // Load the session's messages from backend
      loadSessionMessages(querySession);
    } else if (!querySession) {
    setSessionId(loadSessionId());
    }
  }, [searchParams]);

  /** Load past messages for a given session id */
  const loadSessionMessages = async (sid: string) => {
    try {
      const resp = await fetch(`/api/sessions/${sid}/messages`);
      if (!resp.ok) return;
      const msgs: Array<{
        id: string;
        role: string;
        message_text: string | null;
        session_id: string;
        created_at?: string;
        interpretation?: string | null;
        advice?: string[] | null;
        verse?: { fa?: string; en?: string; kr?: string } | null;
        citations?: Array<{ id: string; book: string; page_number: number; snippet?: string }> | null;
      }> = await resp.json();

      const chatMessages: ChatMessageType[] = msgs.map((m) => {
        if (m.role === 'assistant') {
          // Use structured data from API if available.
          // If missing, leave structured fields empty and show plain content only.
          const verse = m.verse ?? { fa: '', en: undefined, kr: undefined };
          const interpretation = m.interpretation ?? '';
          const advice = m.advice ?? [];
          const citations = m.citations ?? [];

          return {
            id: m.id,
            role: 'assistant' as const,
            content: m.message_text || '',
            timestamp: m.created_at ? new Date(m.created_at) : new Date(),
            verse,
            interpretation,
            advice,
            citations: citations.map(c => ({
              book: c.book || '',
              page: c.page_number || 0,
              refId: c.id || '',
              snippet: c.snippet || '',
            })),
          } as AssistantMessage;
        }
        return {
          id: m.id,
          role: 'user' as const,
          content: m.message_text || '',
          timestamp: m.created_at ? new Date(m.created_at) : new Date(),
        };
      });
      setMessages(chatMessages);
    } catch (err) {
      console.error('[Chat] Failed to load session messages:', err);
    }
  };

  /** Persist session id to state + localStorage when received from backend */
  const handleSessionId = useCallback((id: string | undefined) => {
    if (id) {
      setSessionId(id);
      saveSessionId(id);
    }
  }, []);

  /** Start a brand-new chat session */
  const handleNewChat = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(SESSION_KEY);
    }
    setSessionId(undefined);
    setMessages([]);
    setInput('');
    setIsLoading(false);
    streamingIdRef.current = null;
  }, []);

  /** Switch to an existing chat session */
  const handleSelectSession = useCallback((sid: string) => {
    if (sid === sessionId) return; // already on this session
    setSessionId(sid);
    saveSessionId(sid);
    setMessages([]);
    setIsLoading(false);
    streamingIdRef.current = null;
    loadSessionMessages(sid);
  }, [sessionId]);

  /**
   * Send a message. Uses real SSE streaming from /api/chat/stream.
   * Falls back to non-streaming /api/chat on stream failure.
   */
  const handleSend = useCallback(async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessageType = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    const assistantId = `assistant-${Date.now()}`;
    streamingIdRef.current = assistantId;

    // Build history *before* adding new messages
    const history = buildHistory(messages);

    // Add user message + empty assistant placeholder
    const placeholder: AssistantMessage = {
      id: assistantId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      verse: { fa: '' },
      interpretation: '',
      advice: [''],
      citations: [],
    };

    setMessages((prev) => [...prev, userMessage, placeholder]);
    setInput('');
    setIsLoading(true);

    try {
      await streamChat(
        { message: userMessage.content, language, sourceScope, sessionId, history },
        {
          onChunk: (text) => {
            // Progressive text update
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId
                  ? { ...m, content: (m.content ?? '') + text }
                  : m,
              ),
            );
          },
          onComplete: (data: StreamCompleteData) => {
            // Persist session id
            handleSessionId(data.sessionId);

            // Finalize with full structured data
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId
                  ? { ...m, ...data, id: assistantId, timestamp: new Date() }
                  : m,
              ),
            );
          },
          onError: (error) => {
            console.error('[Chat] Stream error, falling back:', error);
            // Fall back to non-streaming endpoint
            fallbackNonStreaming(userMessage.content, assistantId, history);
          },
        },
      );
    } catch (err) {
      console.error('[Chat] Unexpected error:', err);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? {
                ...m,
                content: 'Sorry, something went wrong. Please try again.',
                interpretation: 'An error occurred while processing your request.',
                advice: ['Please try again or rephrase your question.'],
              }
            : m,
        ),
      );
    } finally {
      streamingIdRef.current = null;
      setIsLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input, isLoading, language, sourceScope, sessionId, messages, handleSessionId]);

  /**
   * Non-streaming fallback — calls /api/chat directly.
   * Used when the streaming endpoint fails.
   */
  const fallbackNonStreaming = async (
    message: string,
    assistantId: string,
    history: HistoryTurn[],
  ) => {
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          language,
          country: 'KR',
          sourceScope,
          sessionId,
          history,
        }),
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();

      // Persist session id from non-streaming response
      handleSessionId(data.sessionId);

      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? {
                id: assistantId,
                role: 'assistant' as const,
                content: data.interpretation || data.advice?.[0] || '',
                timestamp: new Date(),
                verse: data.verse ?? { fa: '' },
                interpretation: data.interpretation ?? '',
                advice: data.advice ?? [''],
                citations: data.citations ?? [],
                retrievedCandidates: data.retrievedCandidates,
                grounded: data.grounded,
              }
            : m,
        ),
      );
    } catch (fallbackErr) {
      console.error('[Chat] Fallback also failed:', fallbackErr);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? {
                ...m,
                content: 'Sorry, something went wrong. Please try again.',
                interpretation: 'An error occurred while processing your request.',
                advice: ['Please try again or rephrase your question.'],
              }
            : m,
        ),
      );
    }
  };

  const handlePromptClick = (prompt: string) => {
    setInput(prompt);
  };

  const handleReport = () => {
    // Chat-linked report: use latest assistant message ID if available, else session for backend to resolve
    const lastAssistant = [...messages].reverse().find((m) => m.role === 'assistant');
    setReportMessageId(lastAssistant?.id ?? 'current');
  };

  const emptyStateVariants = reducedMotion
    ? motionTokens.variants.reducedMotion
    : {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -20 },
      };

  return (
    <ChatPageShell>
      <div className="chat-page-container">
        <ChatPanel>
          <ChatHeader
            citeEnabled={citeEnabled}
            onCiteToggle={setCiteEnabled}
            sourceScope={sourceScope}
            onSourceScopeChange={setSourceScope}
            onNewChat={handleNewChat}
            onHistoryToggle={() => setHistoryOpen((o) => !o)}
          />

          <AnimatePresence mode="wait">
            {messages.length === 0 ? (
              <motion.div
                className="chat-empty-state"
                key="empty-state"
                variants={emptyStateVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={motionTokens.transitionPresets.reveal}
              >
                <motion.div
                  className="chat-empty-icon"
                  initial={reducedMotion ? {} : { scale: 0, rotate: -180 }}
                  animate={reducedMotion ? {} : { scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
                >
                  <MsgSquareIcon className="w-20 h-20" />
                </motion.div>
                <motion.h2
                  className="chat-empty-title"
                  initial={reducedMotion ? {} : { opacity: 0, y: 10 }}
                  animate={reducedMotion ? {} : { opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  {t.chat?.emptyTitle || 'Ask Rumi for Guidance'}
                </motion.h2>
                <motion.p
                  className="chat-empty-text"
                  initial={reducedMotion ? {} : { opacity: 0, y: 10 }}
                  animate={reducedMotion ? {} : { opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  {t.chat?.emptyText || 'Share your questions or concerns, and receive wisdom from Rumi\'s poetry.'}
                </motion.p>
                <motion.div
                  initial={reducedMotion ? {} : { opacity: 0, y: 10 }}
                  animate={reducedMotion ? {} : { opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <SuggestedPrompts language={language} onPromptClick={handlePromptClick} />
                </motion.div>
              </motion.div>
            ) : (
              <MessageList
                key="message-list"
                messages={messages}
                citeEnabled={citeEnabled}
                isLoading={isLoading}
                onCitationClick={setSelectedCitation}
                language={language}
              />
            )}
          </AnimatePresence>

          <Composer
            value={input}
            onChange={setInput}
            onSend={handleSend}
            isLoading={isLoading}
            placeholder={t.chat?.inputPlaceholder || "I'm struggling with letting go of someone I love."}
          />

          <UtilityBar
            onSend={handleSend}
            onReport={handleReport}
            canSend={!!input.trim() && !isLoading}
          />
        </ChatPanel>

        {/* Footer */}
        <footer className="chat-page-footer">
          <a href="/privacy" className="chat-footer-link">
            {t.about?.privacyPolicy || 'Privacy Policy'}
          </a>
          <span className="chat-footer-separator">|</span>
          <a href="/contact" className="chat-footer-link">
            {t.about?.contactUs || 'Contact Us'}
          </a>
        </footer>
      </div>

      {/* Chat History Drawer */}
      <ChatHistoryDrawer
        isOpen={historyOpen}
        onClose={() => setHistoryOpen(false)}
        onSelectSession={handleSelectSession}
        onNewChat={handleNewChat}
        currentSessionId={sessionId}
      />

      {/* Citation Modal */}
      <CitationModal citation={selectedCitation} onClose={() => setSelectedCitation(null)} />

      {/* Report Modal */}
      <ReportModal
        isOpen={reportMessageId !== null}
        onClose={() => setReportMessageId(null)}
        messageId={reportMessageId || undefined}
        sessionId={sessionId}
      />
    </ChatPageShell>
  );
}
