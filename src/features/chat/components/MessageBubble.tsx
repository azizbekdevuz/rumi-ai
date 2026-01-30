'use client';

import { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useReducedMotion } from '@/lib/hooks';
import { motion as motionTokens } from '@/lib/design-system/motion';
import { ChatMessage as ChatMessageType, AssistantMessage, Citation } from '@/types/chat';
import VerseCard from './VerseCard';
import CitationChip from './CitationChip';
import Image from 'next/image';

interface MessageBubbleProps {
  message: ChatMessageType;
  citeEnabled: boolean;
  onCitationClick?: (citation: Citation) => void;
  language: 'fa' | 'en' | 'kr';
}

function MessageBubble({ message, citeEnabled, onCitationClick, language }: MessageBubbleProps) {
  const reducedMotion = useReducedMotion();

  // User Message Variant
  if (message.role === 'user') {
    const userVariants = reducedMotion
      ? motionTokens.variants.reducedMotion
      : {
          initial: { opacity: 0, x: 24, scale: 0.95 },
          animate: {
            opacity: 1,
            x: 0,
            scale: 1,
            transition: {
              type: 'spring' as const,
              stiffness: 300,
              damping: 25,
            },
          },
        };

    return (
      <motion.div
        className="message-bubble-wrapper message-bubble-user"
        variants={userVariants}
        initial="initial"
        animate="animate"
        layout
      >
        <div className="message-bubble-user-content">
          <div className="message-bubble-user-bubble">
            <p className="message-bubble-text">{message.content}</p>
          </div>
          <div className="message-bubble-user-avatar">
            <Image
              src="/img/chat/default-avatar-male.webp"
              alt="User"
              width={32}
              height={32}
              className="avatar-image"
            />
          </div>
        </div>
      </motion.div>
    );
  }

  // Assistant Message Variant
  const assistantMessage = message as AssistantMessage;

  const assistantVariants = reducedMotion
    ? motionTokens.variants.reducedMotion
    : {
        initial: { opacity: 0, x: -24, scale: 0.95 },
        animate: {
          opacity: 1,
          x: 0,
          scale: 1,
          transition: {
            type: 'spring' as const,
            stiffness: 300,
            damping: 25,
          },
        },
      };

  const sectionVariants = reducedMotion
      ? motionTokens.variants.reducedMotion
      : {
          initial: { opacity: 0, y: 8 },
          animate: {
            opacity: 1,
            y: 0,
            transition: {
              type: 'spring' as const,
              stiffness: 300,
              damping: 25,
            },
          },
        };

  const hasVerse = assistantMessage.verse?.fa;
  const hasInterpretation = assistantMessage.interpretation;
  const hasAdvice = assistantMessage.advice && assistantMessage.advice.length > 0;
  const hasCitations = assistantMessage.citations && assistantMessage.citations.length > 0;
  const firstCitation = hasCitations ? assistantMessage.citations[0] : null;

  return (
    <motion.article
      className="message-bubble-wrapper message-bubble-assistant"
      variants={assistantVariants}
      initial="initial"
      animate="animate"
      layout
      aria-label="Rumi AI response"
    >
      <div className="message-bubble-assistant-content">
        {/* AI Avatar */}
        <div className="message-bubble-assistant-avatar">
          <Image
            src="/img/chat/agent-avatar.webp"
            alt="Rumi AI Agent"
            width={40}
            height={40}
            className="avatar-image"
          />
        </div>

        <div className="message-bubble-assistant-bubble">
          {/* Verse Card (first message only, if verse exists) */}
          {hasVerse && (
            <motion.section
              className="message-bubble-verse-section"
              variants={sectionVariants}
              initial="initial"
              animate="animate"
            >
              <VerseCard
                verse={assistantMessage.verse}
                citation={firstCitation || undefined}
                language={language}
              />
            </motion.section>
          )}

          {/* Interpretation Section */}
          {hasInterpretation && (
            <motion.section
              className="message-bubble-interpretation-section"
              variants={sectionVariants}
              initial="initial"
              animate="animate"
            >
              <p className="message-bubble-interpretation-text">
                {assistantMessage.interpretation}
              </p>
            </motion.section>
          )}

          {/* Practical Advice Section */}
          {hasAdvice && (
            <motion.section
              className="message-bubble-advice-section"
              variants={sectionVariants}
              initial="initial"
              animate="animate"
            >
              {assistantMessage.advice.map((item, index) => (
                <motion.p
                  key={index}
                  className="message-bubble-advice-item"
                  initial={reducedMotion ? {} : { opacity: 0, x: -8 }}
                  animate={reducedMotion ? {} : { opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + index * 0.05 }}
                >
                  {item}
                </motion.p>
              ))}
            </motion.section>
          )}

          {/* Citations Section */}
          {hasCitations && (
            <motion.section
              className="message-bubble-citations-section"
              variants={sectionVariants}
              initial="initial"
              animate="animate"
            >
              <AnimatePresence>
                {citeEnabled ? (
                  <motion.div
                    className="message-bubble-citations-list"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ type: 'spring' as const, stiffness: 300, damping: 30 }}
                  >
                    {assistantMessage.citations.map((citation, index) => (
                      <CitationChip
                        key={index}
                        citation={citation}
                        onClick={() => onCitationClick?.(citation)}
                        variant="inline"
                      />
                    ))}
                  </motion.div>
                ) : (
                  <motion.button
                    className="message-bubble-show-citations"
                    onClick={() => {
                      // This will be handled by parent if needed
                      // For now, clicking will show citations inline
                    }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    aria-label="Show citations"
                  >
                    Show citations
                  </motion.button>
                )}
              </AnimatePresence>
            </motion.section>
          )}

          {/* RTL Persian line at bottom (if long message) */}
          {hasVerse && (hasInterpretation || hasAdvice) && (
            <motion.p
              className="message-bubble-rtl-line"
              lang="fa"
              dir="rtl"
              variants={sectionVariants}
              initial="initial"
              animate="animate"
            >
              {assistantMessage.verse.fa.split(' ').slice(0, 5).join(' ')}...
            </motion.p>
          )}
        </div>
      </div>
    </motion.article>
  );
}

export default memo(MessageBubble);
