'use client';

import { useState } from 'react';
import { useI18n } from '@/lib/i18n/i18n-context';
import { ChatMessage as ChatMessageType, AssistantMessage, SourceScope, Citation } from '../../types/chat';
import CitationModal from '@/features/chat/components/CitationModal';
import ReportModal from '@/features/chat/components/ReportModal';
import SuggestedPrompts from '@/features/chat/components/SuggestedPrompts';
import ChatPageShell from '@/features/chat/components/ChatPageShell';
import ChatPanel from '@/features/chat/components/ChatPanel';
import ChatHeader from '@/features/chat/components/ChatHeader';
import MessageList from '@/features/chat/components/MessageList';
import Composer from '@/features/chat/components/Composer';
import UtilityBar from '@/features/chat/components/UtilityBar';
import { motion, AnimatePresence } from 'framer-motion';
import { motion as motionTokens } from '@/lib/design-system/motion';
import { useReducedMotion } from '@/lib/hooks';
import { MsgSquareIcon } from '@/components/ui/icons';

export default function ChatPage() {
  const { language, t } = useI18n();
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  //eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [sourceScope, setSourceScope] = useState<SourceScope>('books');
  const [citeEnabled, setCiteEnabled] = useState(true);
  const [selectedCitation, setSelectedCitation] = useState<Citation | null>(null);
  const [reportMessageId, setReportMessageId] = useState<string | null>(null);
  const reducedMotion = useReducedMotion();

  const simulateStreaming = async (response: ChatMessageType): Promise<AssistantMessage> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          id: response.id,
          role: 'assistant',
          content: (response as AssistantMessage).interpretation,
          timestamp: new Date(),
          verse: (response as AssistantMessage).verse,
          interpretation: (response as AssistantMessage).interpretation,
          advice: (response as AssistantMessage).advice,
          citations: (response as AssistantMessage).citations,
          retrievedCandidates: (response as AssistantMessage).retrievedCandidates,
        });
      }, 1500);
    });
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessageType = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage.content,
          language,
          country: 'KR',
          sourceScope,
          history: messages,
        }),
      });

      const data = await response.json();
      const assistantMessage = await simulateStreaming(data);

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Failed to send message:', error);
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          role: 'assistant',
          content: 'Sorry, something went wrong. Please try again.',
          timestamp: new Date(),
          verse: { fa: '' },
          interpretation: 'An error occurred while processing your request.',
          advice: ['Please try again or rephrase your question.'],
          citations: [],
        } as AssistantMessage,
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePromptClick = (prompt: string) => {
    setInput(prompt);
  };

  const handleReport = () => {
    setReportMessageId('current');
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
          <ChatHeader citeEnabled={citeEnabled} onCiteToggle={setCiteEnabled} />

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
            Privacy Policy
          </a>
          <span className="chat-footer-separator">|</span>
          <a href="/contact" className="chat-footer-link">
            Contact Us
          </a>
        </footer>
      </div>

      {/* Citation Modal */}
      <CitationModal citation={selectedCitation} onClose={() => setSelectedCitation(null)} />

      {/* Report Modal */}
      <ReportModal
        isOpen={reportMessageId !== null}
        onClose={() => setReportMessageId(null)}
        messageId={reportMessageId || undefined}
      />
    </ChatPageShell>
  );
}
