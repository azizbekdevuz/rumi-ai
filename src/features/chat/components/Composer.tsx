'use client';

import { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useReducedMotion } from '@/lib/hooks';
import { SendIcon } from '@/components/ui/icons';

interface ComposerProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  isLoading: boolean;
  placeholder?: string;
}

export default function Composer({
  value,
  onChange,
  onSend,
  isLoading,
  placeholder = "I'm struggling with letting go of someone I love.",
}: ComposerProps) {
  const reducedMotion = useReducedMotion();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  const buttonVariants = reducedMotion
    ? undefined
    : {
        hover: { scale: 1.05 },
        tap: { scale: 0.95 },
      };

  return (
    <div className="chat-composer">
      <div className="chat-composer-input-wrapper">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="chat-composer-input"
          disabled={isLoading}
          aria-label="Chat message input"
        />
        <motion.button
          className="chat-composer-send-small"
          onClick={onSend}
          disabled={!value.trim() || isLoading}
          aria-label="Send message"
          variants={buttonVariants}
          whileHover={reducedMotion || !value.trim() || isLoading ? {} : 'hover'}
          whileTap={reducedMotion || !value.trim() || isLoading ? {} : 'tap'}
        >
          <SendIcon style={{ width: 16, height: 16 }} />
        </motion.button>
        <motion.button
          className="chat-composer-mic"
          aria-label="Voice input"
          variants={buttonVariants}
          whileHover={reducedMotion ? {} : 'hover'}
          whileTap={reducedMotion ? {} : 'tap'}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
            <line x1="12" y1="19" x2="12" y2="23" />
            <line x1="8" y1="23" x2="16" y2="23" />
          </svg>
        </motion.button>
      </div>
    </div>
  );
}
