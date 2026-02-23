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
      </div>
    </div>
  );
}
