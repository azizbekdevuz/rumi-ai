'use client';

import { ChatMessage as ChatMessageType, AssistantMessage, Citation } from '../../../types/chat';
import { useI18n } from '@/lib/i18n/i18n-context';
import { useState } from 'react';
import { 
  RumiLogo, 
  ThumbsUpIcon, 
  ThumbsDownIcon, 
  ReportIcon,
  ChevronRightIcon 
} from '@/components/ui/icons';
import { motion, AnimatePresence } from 'framer-motion';
import { motion as motionTokens } from '@/lib/design-system/motion';
import { useReducedMotion } from '@/lib/hooks';

interface ChatMessageProps {
  message: ChatMessageType;
  onCitationClick?: (citation: Citation) => void;
  onFeedback?: (messageId: string, type: 'up' | 'down') => void;
  onReport?: (messageId: string) => void;
}

export default function ChatMessage({
  message,
  onCitationClick,
  onFeedback,
  onReport,
}: ChatMessageProps) {
  const { language } = useI18n();
  const [showReasoning, setShowReasoning] = useState(false);
  const [feedbackGiven, setFeedbackGiven] = useState<'up' | 'down' | null>(null);
  const reducedMotion = useReducedMotion();

  const handleFeedback = (type: 'up' | 'down') => {
    setFeedbackGiven(type);
    onFeedback?.(message.id, type);
  };

  const messageVariants = reducedMotion
    ? motionTokens.variants.reducedMotion
    : {
        initial: { opacity: 0, y: 16, scale: 0.98 },
        animate: { 
          opacity: 1, 
          y: 0, 
          scale: 1,
          transition: { type: 'spring' as const, stiffness: 300, damping: 25 }
        },
        exit: { opacity: 0, y: -8, scale: 0.98 },
      };

  if (message.role === 'user') {
    return (
      <motion.div 
        className="chat-message user-message"
        variants={messageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        layout
      >
        <div className="message-content">
          <div className="message-bubble user-bubble">
            <p className="message-text">{message.content}</p>
          </div>
        </div>
      </motion.div>
    );
  }

  const assistantMessage = message as AssistantMessage;

  const sectionVariants = reducedMotion
    ? motionTokens.variants.reducedMotion
    : {
        initial: { opacity: 0, y: 8 },
        animate: { opacity: 1, y: 0 },
      };

  return (
    <motion.article 
      className="chat-message assistant-message" 
      aria-label="Rumi AI response"
      variants={messageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      layout
    >
      <motion.div 
        className="message-avatar" 
        aria-hidden="true"
        initial={reducedMotion ? {} : { scale: 0, rotate: -180 }}
        animate={reducedMotion ? {} : { scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
      >
        <RumiLogo />
      </motion.div>
      <div className="message-content">
        <div className="message-bubble assistant-bubble">
          {/* Verse Section */}
          <motion.section 
            className="verse-section" 
            aria-labelledby={`verse-label-${message.id}`}
            variants={sectionVariants}
            initial="initial"
            animate="animate"
            transition={{ delay: 0.1, ...motionTokens.transitionPresets.reveal }}
          >
            <h4 id={`verse-label-${message.id}`} className="verse-label">Rumi's Verse</h4>
            <p className="verse-text-fa" lang="fa" dir="rtl">
              {assistantMessage.verse.fa}
            </p>
            {assistantMessage.verse[language] && language !== 'fa' && (
              <p className="verse-text-translation">
                {assistantMessage.verse[language]}
              </p>
            )}
          </motion.section>

          {/* Interpretation Section */}
          <motion.section 
            className="interpretation-section" 
            aria-labelledby={`interpretation-label-${message.id}`}
            variants={sectionVariants}
            initial="initial"
            animate="animate"
            transition={{ delay: 0.2, ...motionTokens.transitionPresets.reveal }}
          >
            <h4 id={`interpretation-label-${message.id}`} className="section-label">Interpretation</h4>
            <p className="interpretation-text">{assistantMessage.interpretation}</p>
          </motion.section>

          {/* Practical Advice Section */}
          <motion.section 
            className="advice-section" 
            aria-labelledby={`advice-label-${message.id}`}
            variants={sectionVariants}
            initial="initial"
            animate="animate"
            transition={{ delay: 0.3, ...motionTokens.transitionPresets.reveal }}
          >
            <h4 id={`advice-label-${message.id}`} className="section-label">Practical Advice</h4>
            <ul className="advice-list">
              {assistantMessage.advice.map((item, index) => (
                <motion.li 
                  key={index} 
                  className="advice-item"
                  initial={reducedMotion ? {} : { opacity: 0, x: -8 }}
                  animate={reducedMotion ? {} : { opacity: 1, x: 0 }}
                  transition={{ delay: 0.35 + index * 0.05 }}
                >
                  {item}
                </motion.li>
              ))}
            </ul>
          </motion.section>

          {/* Citations Section */}
          {assistantMessage.citations.length > 0 && (
            <motion.section 
              className="citations-section" 
              aria-labelledby={`citations-label-${message.id}`}
              variants={sectionVariants}
              initial="initial"
              animate="animate"
              transition={{ delay: 0.4, ...motionTokens.transitionPresets.reveal }}
            >
              <h4 id={`citations-label-${message.id}`} className="section-label">Sources</h4>
              <div className="citations-list" role="list">
                {assistantMessage.citations.map((citation, index) => (
                  <motion.button
                    key={index}
                    className="citation-link"
                    onClick={() => onCitationClick?.(citation)}
                    aria-label={`View citation from ${citation.book}, page ${citation.page}`}
                    whileHover={reducedMotion ? {} : { scale: 1.02, y: -2 }}
                    whileTap={reducedMotion ? {} : { scale: 0.98 }}
                  >
                    {citation.book}, p. {citation.page}
                  </motion.button>
                ))}
              </div>
            </motion.section>
          )}

          {/* Show Reasoning Toggle */}
          {assistantMessage.retrievedCandidates && assistantMessage.retrievedCandidates.length > 0 && (
            <div className="reasoning-section">
              <motion.button
                className="reasoning-toggle"
                onClick={() => setShowReasoning(!showReasoning)}
                aria-expanded={showReasoning}
                aria-controls={`reasoning-content-${message.id}`}
                whileHover={reducedMotion ? {} : { x: 4 }}
                whileTap={reducedMotion ? {} : { scale: 0.98 }}
              >
                <motion.span
                  style={{ display: 'inline-block', marginRight: '4px' }}
                  animate={{ rotate: showReasoning ? 90 : 0 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                >
                  <ChevronRightIcon style={{ width: 14, height: 14, verticalAlign: 'middle' }} />
                </motion.span>
                Show reasoning path
              </motion.button>
              <AnimatePresence>
                {showReasoning && (
                  <motion.div 
                    id={`reasoning-content-${message.id}`} 
                    className="reasoning-content"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  >
                    <p className="reasoning-label">Sources considered for this response:</p>
                    <ul className="reasoning-list">
                      {assistantMessage.retrievedCandidates.map((candidate, index) => (
                        <motion.li 
                          key={index} 
                          className="reasoning-item"
                          initial={reducedMotion ? {} : { opacity: 0, x: -8 }}
                          animate={reducedMotion ? {} : { opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.03 }}
                        >
                          • {candidate.book}, p. {candidate.page}
                        </motion.li>
                      ))}
                    </ul>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Feedback Controls */}
        <motion.div 
          className="message-controls" 
          role="group" 
          aria-label="Message feedback"
          initial={reducedMotion ? {} : { opacity: 0, y: 8 }}
          animate={reducedMotion ? {} : { opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <motion.button
            className="control-btn"
            onClick={() => handleFeedback('up')}
            aria-label="Mark as helpful"
            aria-pressed={feedbackGiven === 'up'}
            style={{ 
              color: feedbackGiven === 'up' ? 'var(--success)' : undefined,
              background: feedbackGiven === 'up' ? 'var(--accent-teal-light)' : undefined,
            }}
            whileHover={reducedMotion ? {} : { scale: 1.1 }}
            whileTap={reducedMotion ? {} : { scale: 0.9 }}
          >
            <ThumbsUpIcon />
          </motion.button>
          <motion.button
            className="control-btn"
            onClick={() => handleFeedback('down')}
            aria-label="Mark as not helpful"
            aria-pressed={feedbackGiven === 'down'}
            style={{ 
              color: feedbackGiven === 'down' ? 'var(--error)' : undefined,
              background: feedbackGiven === 'down' ? 'var(--accent-gold-light)' : undefined,
            }}
            whileHover={reducedMotion ? {} : { scale: 1.1 }}
            whileTap={reducedMotion ? {} : { scale: 0.9 }}
          >
            <ThumbsDownIcon />
          </motion.button>
          <motion.button 
            className="control-btn report-btn" 
            onClick={() => onReport?.(message.id)}
            aria-label="Report issue with this response"
            whileHover={reducedMotion ? {} : { scale: 1.02 }}
            whileTap={reducedMotion ? {} : { scale: 0.98 }}
          >
            <ReportIcon style={{ width: 14, height: 14, marginRight: 4 }} />
            Report
          </motion.button>
        </motion.div>
      </div>
    </motion.article>
  );
}
