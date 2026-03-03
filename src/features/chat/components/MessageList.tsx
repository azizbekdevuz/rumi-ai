'use client';

import { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useReducedMotion } from '@/lib/hooks';
import { ChatMessage, Citation } from '@/types/chat';
import MessageBubble from './MessageBubble';
import { LoaderIcon } from '@/components/ui/icons';

interface MessageListProps {
  messages: ChatMessage[];
  citeEnabled: boolean;
  isLoading: boolean;
  onCitationClick: (citation: Citation) => void;
  language: 'fa' | 'en' | 'kr';
}

export default function MessageList({
  messages,
  citeEnabled,
  isLoading,
  onCitationClick,
  language,
}: MessageListProps) {
  const reducedMotion = useReducedMotion();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Show scroll button when user scrolls up
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      setShowScrollButton(!isNearBottom);
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollButtonVariants = reducedMotion
    ? undefined
    : {
        hover: { scale: 1.1, y: -2 },
        tap: { scale: 0.9 },
      };

  return (
    <div className="chat-message-list-wrapper" ref={containerRef}>
      {/* Scroll gradient at top */}
      <div className="chat-message-list-gradient-top" />

      <div className="chat-message-list" role="log" aria-label="Chat conversation" aria-live="polite">
        <AnimatePresence mode="popLayout">
          {messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              citeEnabled={citeEnabled}
              onCitationClick={onCitationClick}
              language={language}
            />
          ))}
        </AnimatePresence>

        {/* Loading Indicator — only when no assistant placeholder is already visible */}
        <AnimatePresence>
          {isLoading && messages.length > 0 && messages[messages.length - 1].role !== 'assistant' && (
            <motion.div
              className="chat-message-loading"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            >
              <div className="chat-message-loading-avatar">
                <LoaderIcon
                  style={{
                    width: 20,
                    height: 20,
                    animation: 'spin 1s linear infinite',
                  }}
                />
              </div>
              <div className="chat-message-loading-dots">
                <span />
                <span />
                <span />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div ref={messagesEndRef} />
      </div>

      {/* Scroll gradient at bottom */}
      <div className="chat-message-list-gradient-bottom" />

      {/* Scroll to bottom button */}
      <AnimatePresence>
        {showScrollButton && (
          <motion.button
            className="chat-scroll-to-bottom"
            onClick={scrollToBottom}
            aria-label="Scroll to bottom"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            variants={scrollButtonVariants}
            whileHover={reducedMotion || !scrollButtonVariants ? undefined : 'hover'}
            whileTap={reducedMotion || !scrollButtonVariants ? undefined : 'tap'}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
