'use client';

import { motion } from 'framer-motion';
import { useReducedMotion } from '@/lib/hooks';
import { motion as motionTokens } from '@/lib/design-system/motion';
import Image from 'next/image';

interface ChatPanelProps {
  children: React.ReactNode;
}

export default function ChatPanel({ children }: ChatPanelProps) {
  const reducedMotion = useReducedMotion();

  const panelVariants = reducedMotion
    ? motionTokens.variants.reducedMotion
    : {
        initial: { opacity: 0, y: 20, scale: 0.98 },
        animate: {
          opacity: 1,
          y: 0,
          scale: 1,
          transition: {
            type: 'spring' as const,
            stiffness: 120,
            damping: 20,
            delay: 0.1,
          },
        },
      };

  const avatarVariants = reducedMotion
    ? undefined
    : {
        initial: { scale: 0, rotate: -180 },
        animate: { scale: 1, rotate: 0 },
        transition: { type: 'spring' as const, stiffness: 200, damping: 15, delay: 0.2 },
      };

  return (
    <motion.div
      className="chat-panel"
      variants={panelVariants}
      initial="initial"
      animate="animate"
    >
      {/* Avatar Badge - rendered outside panel-inner to escape stacking context */}
      <motion.div
        className="chat-header-avatar-badge"
        variants={avatarVariants}
        initial="initial"
        animate="animate"
      >
        <Image
          src="/img/chat/agent-avatar.webp"
          alt="Rumi AI Agent"
          width={56}
          height={56}
          className="avatar-image"
          priority
        />
      </motion.div>

      <div className="chat-panel-inner">
        {children}
      </div>
    </motion.div>
  );
}
