'use client';

import { useState, useRef, useEffect } from 'react';
import { useI18n } from '@/lib/i18n/i18n-context';
import { ChatMessage as ChatMessageType, AssistantMessage, SourceScope, Citation } from '../../types/chat';
import ChatMessage from '@/features/chat/components/ChatMessage';
import CitationModal from '@/features/chat/components/CitationModal';
import ReportModal from '@/features/chat/components/ReportModal';
import SuggestedPrompts from '@/features/chat/components/SuggestedPrompts';
import { RumiLogo, SendIcon, LoaderIcon } from '@/components/ui/icons';
import { motion, AnimatePresence } from 'framer-motion';
import { motion as motionTokens } from '@/lib/design-system/motion';
import { useReducedMotion } from '@/lib/hooks';

export default function ChatPage() {
  const { language, t } = useI18n();
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sourceScope, setSourceScope] = useState<SourceScope>('books');
  const [selectedCitation, setSelectedCitation] = useState<Citation | null>(null);
  const [reportMessageId, setReportMessageId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Auto-focus input on page load
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

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
      // Add error message
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
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handlePromptClick = (prompt: string) => {
    setInput(prompt);
    inputRef.current?.focus();
  };

  const handleFeedback = (messageId: string, type: 'up' | 'down') => {
    console.log(`Feedback for ${messageId}: ${type}`);
    // TODO: Send feedback to backend
  };

  const handleReport = (messageId: string) => {
    setReportMessageId(messageId);
  };

  const reducedMotion = useReducedMotion();

  const scopeOptions: { value: SourceScope; label: string }[] = [
    { value: 'books', label: t.chat?.scopeBooks || 'My Sources Only' },
    { value: 'web_books', label: t.chat?.scopeWebBooks || 'Web + Books' },
    { value: 'web', label: t.chat?.scopeWeb || 'Web Only' },
  ];

  const emptyStateVariants = reducedMotion
    ? motionTokens.variants.reducedMotion
    : {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -20 },
      };

  const loadingVariants = reducedMotion
    ? motionTokens.variants.reducedMotion
    : {
        initial: { opacity: 0, scale: 0.95 },
        animate: { opacity: 1, scale: 1 },
        exit: { opacity: 0, scale: 0.95 },
      };

  return (
    <div className="chat-page">
      <a href="#chat-input" className="skip-link" style={{ left: '140px' }}>
        Skip to chat input
      </a>

      <div className="chat-container" ref={chatContainerRef}>
        {/* Source Scope Toggle */}
        <motion.div 
          className="chat-controls"
          initial={reducedMotion ? {} : { opacity: 0, y: -10 }}
          animate={reducedMotion ? {} : { opacity: 1, y: 0 }}
          transition={{ delay: 0.1, ...motionTokens.transitionPresets.reveal }}
        >
          <div className="source-scope-toggle" role="radiogroup" aria-label="Source selection">
            {scopeOptions.map((option, index) => (
              <motion.button
                key={option.value}
                className={`scope-btn ${sourceScope === option.value ? 'active' : ''}`}
                onClick={() => setSourceScope(option.value)}
                role="radio"
                aria-checked={sourceScope === option.value}
                whileHover={reducedMotion ? {} : { scale: 1.02 }}
                whileTap={reducedMotion ? {} : { scale: 0.98 }}
                initial={reducedMotion ? {} : { opacity: 0, y: -5 }}
                animate={reducedMotion ? {} : { opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + index * 0.05 }}
              >
                {option.label}
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Chat Messages */}
        <div 
          className="chat-messages" 
          role="log" 
          aria-label="Chat conversation"
          aria-live="polite"
          aria-relevant="additions"
        >
          <AnimatePresence mode="wait">
            {messages.length === 0 && (
              <motion.div 
                className="chat-empty"
                key="empty-state"
                variants={emptyStateVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={motionTokens.transitionPresets.reveal}
              >
                <motion.div 
                  className="empty-icon"
                  initial={reducedMotion ? {} : { scale: 0, rotate: -180 }}
                  animate={reducedMotion ? {} : { scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
                >
                  <RumiLogo />
                </motion.div>
                <motion.h2 
                  className="empty-title"
                  initial={reducedMotion ? {} : { opacity: 0, y: 10 }}
                  animate={reducedMotion ? {} : { opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  {t.chat?.emptyTitle || 'Ask Rumi for Guidance'}
                </motion.h2>
                <motion.p 
                  className="empty-text"
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
            )}
          </AnimatePresence>

          <AnimatePresence>
            {messages.map((message) => (
              <ChatMessage
                key={message.id}
                message={message}
                onCitationClick={setSelectedCitation}
                onFeedback={handleFeedback}
                onReport={handleReport}
              />
            ))}
          </AnimatePresence>

          <AnimatePresence>
            {isLoading && (
              <motion.div 
                className="chat-message assistant-message" 
                aria-label="Rumi is thinking"
                key="loading-indicator"
                variants={loadingVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              >
                <motion.div 
                  className="message-avatar"
                  animate={reducedMotion ? {} : { rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <RumiLogo />
                </motion.div>
                <div className="message-content">
                  <div className="typing-indicator" role="status" aria-label="Loading response">
                    <motion.span
                      animate={{ y: [0, -8, 0] }}
                      transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                    />
                    <motion.span
                      animate={{ y: [0, -8, 0] }}
                      transition={{ duration: 0.6, repeat: Infinity, delay: 0.15 }}
                    />
                    <motion.span
                      animate={{ y: [0, -8, 0] }}
                      transition={{ duration: 0.6, repeat: Infinity, delay: 0.3 }}
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <motion.div 
          className="chat-input-container" 
          id="chat-input"
          initial={reducedMotion ? {} : { opacity: 0, y: 20 }}
          animate={reducedMotion ? {} : { opacity: 1, y: 0 }}
          transition={{ delay: 0.2, ...motionTokens.transitionPresets.reveal }}
        >
          <div className="chat-input-wrapper">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t.chat?.inputPlaceholder || 'Describe your struggle or ask a question...'}
              className="chat-input"
              rows={2}
              aria-label="Chat message input"
              disabled={isLoading}
            />
            <motion.button
              onClick={handleSend}
              className="send-button"
              disabled={!input.trim() || isLoading}
              aria-label="Send message"
              whileHover={reducedMotion || !input.trim() || isLoading ? {} : { scale: 1.05 }}
              whileTap={reducedMotion || !input.trim() || isLoading ? {} : { scale: 0.95 }}
            >
              {isLoading ? (
                <motion.span
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  style={{ display: 'flex' }}
                >
                  <LoaderIcon />
                </motion.span>
              ) : (
                <motion.span
                  initial={false}
                  animate={input.trim() ? { x: 2 } : { x: 0 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  style={{ display: 'flex' }}
                >
                  <SendIcon />
                </motion.span>
              )}
            </motion.button>
          </div>
        </motion.div>
      </div>

      {/* Citation Modal */}
      <CitationModal 
        citation={selectedCitation} 
        onClose={() => setSelectedCitation(null)} 
      />

      {/* Report Modal */}
      <ReportModal
        isOpen={reportMessageId !== null}
        onClose={() => setReportMessageId(null)}
        messageId={reportMessageId || undefined}
      />

      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
