'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useReducedMotion } from '@/lib/hooks';
//eslint-disable-next-line @typescript-eslint/no-unused-vars
import { motion as motionTokens } from '@/lib/design-system/motion';
import { HeartIcon } from '@/components/ui/icons';

interface ChatHeaderProps {
  citeEnabled: boolean;
  onCiteToggle: (enabled: boolean) => void;
}

export default function ChatHeader({ citeEnabled, onCiteToggle }: ChatHeaderProps) {
  const reducedMotion = useReducedMotion();
  const [isFavorited, setIsFavorited] = useState(false);

  const handleCiteToggle = () => {
    onCiteToggle(!citeEnabled);
  };

  const handleFavorite = () => {
    setIsFavorited(!isFavorited);
  };

  const buttonVariants = reducedMotion
    ? undefined
    : {
        hover: { scale: 1.05 },
        tap: { scale: 0.95 },
      };

  return (
    <div className="chat-header">
      <div className="chat-header-content">
        <h2 className="chat-header-title">Rumi AI Agent</h2>

        <div className="chat-header-actions">
          {/* Heart Icon */}
          <motion.button
            className="chat-header-action-btn"
            onClick={handleFavorite}
            aria-label={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
            variants={buttonVariants}
            whileHover={reducedMotion ? {} : 'hover'}
            whileTap={reducedMotion ? {} : 'tap'}
          >
            <HeartIcon
              style={{
                width: 20,
                height: 20,
                fill: isFavorited ? 'var(--accent-gold)' : 'none',
                color: isFavorited ? 'var(--accent-gold)' : 'var(--text-secondary)',
              }}
            />
          </motion.button>

          {/* Cite Toggle */}
          <motion.button
            className={`chat-header-cite-toggle ${citeEnabled ? 'active' : ''}`}
            onClick={handleCiteToggle}
            aria-label={citeEnabled ? 'Hide citations' : 'Show citations'}
            aria-pressed={citeEnabled}
            variants={buttonVariants}
            whileHover={reducedMotion ? {} : 'hover'}
            whileTap={reducedMotion ? {} : 'tap'}
          >
            Cite
          </motion.button>

          {/* Small Icon Button (placeholder for future feature) */}
          <motion.button
            className="chat-header-action-btn"
            aria-label="More options"
            variants={buttonVariants}
            whileHover={reducedMotion ? {} : 'hover'}
            whileTap={reducedMotion ? {} : 'tap'}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle cx="8" cy="3" r="1.5" fill="currentColor" />
              <circle cx="8" cy="8" r="1.5" fill="currentColor" />
              <circle cx="8" cy="13" r="1.5" fill="currentColor" />
            </svg>
          </motion.button>
        </div>
      </div>

      {/* Divider Line */}
      <div className="chat-header-divider" />
    </div>
  );
}
