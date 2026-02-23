'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useReducedMotion } from '@/lib/hooks';
import { HeartIcon, NewChatIcon } from '@/components/ui/icons';
import type { SourceScope } from '@/types/chat';

// ── Source scope options ─────────────────────────────────────────

const SOURCE_SCOPE_OPTIONS: { value: SourceScope; label: string }[] = [
  { value: 'books', label: 'Books' },
  { value: 'web_books', label: 'Hybrid' },
  { value: 'web', label: 'Web' },
];

// ── Props ────────────────────────────────────────────────────────

interface ChatHeaderProps {
  citeEnabled: boolean;
  onCiteToggle: (enabled: boolean) => void;
  sourceScope: SourceScope;
  onSourceScopeChange: (scope: SourceScope) => void;
  onNewChat?: () => void;
}

export default function ChatHeader({
  citeEnabled,
  onCiteToggle,
  sourceScope,
  onSourceScopeChange,
  onNewChat,
}: ChatHeaderProps) {
  const reducedMotion = useReducedMotion();
  const [isFavorited, setIsFavorited] = useState(false);

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
          {/* New Chat */}
          {onNewChat && (
            <motion.button
              className="chat-header-action-btn"
              onClick={onNewChat}
              aria-label="New chat"
              whileHover={reducedMotion ? {} : { scale: 1.05 }}
              whileTap={reducedMotion ? {} : { scale: 0.95 }}
              title="New chat"
            >
              <NewChatIcon style={{ width: 18, height: 18 }} />
            </motion.button>
          )}

          {/* Source scope selector */}
          <div className="chat-header-scope-group" role="radiogroup" aria-label="Source scope">
            {SOURCE_SCOPE_OPTIONS.map((opt) => (
              <motion.button
                key={opt.value}
                className={`chat-header-scope-btn ${sourceScope === opt.value ? 'active' : ''}`}
                onClick={() => onSourceScopeChange(opt.value)}
                aria-pressed={sourceScope === opt.value}
                whileHover={reducedMotion ? {} : { scale: 1.05 }}
                whileTap={reducedMotion ? {} : { scale: 0.95 }}
              >
                {opt.label}
              </motion.button>
            ))}
          </div>

          {/* Heart Icon */}
          <motion.button
            className="chat-header-action-btn"
            onClick={() => setIsFavorited(!isFavorited)}
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
            onClick={() => onCiteToggle(!citeEnabled)}
            aria-label={citeEnabled ? 'Hide citations' : 'Show citations'}
            aria-pressed={citeEnabled}
            variants={buttonVariants}
            whileHover={reducedMotion ? {} : 'hover'}
            whileTap={reducedMotion ? {} : 'tap'}
          >
            Cite
          </motion.button>

        </div>
      </div>

      {/* Divider Line */}
      <div className="chat-header-divider" />
    </div>
  );
}
