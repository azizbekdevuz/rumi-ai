'use client';

import { motion } from 'framer-motion';
import { useReducedMotion } from '@/lib/hooks';
import { motion as motionTokens } from '@/lib/design-system/motion';

interface ChatPageShellProps {
  children: React.ReactNode;
}

export default function ChatPageShell({ children }: ChatPageShellProps) {
  const reducedMotion = useReducedMotion();

  const heroVariants = reducedMotion
    ? motionTokens.variants.reducedMotion
    : {
        initial: { opacity: 0, y: 20, filter: 'blur(8px)' },
        animate: {
          opacity: 1,
          y: 0,
          filter: 'blur(0px)',
          transition: {
            duration: 0.6,
            ease: [0.45, 0, 0.15, 1] as const,
          },
        },
      };

  return (
    <div className="chat-page-shell">
      {/* Page Background Stack */}
      {/* Layer 1: Background Image (z-index: 0) */}
      <div className="chat-background" aria-hidden="true" />
      
      {/* Layer 2: Soft Radial Bloom Behind Panel (z-index: 1) */}
      <div className="chat-background-bloom" aria-hidden="true" />
      
      {/* Layer 3: Ultra Subtle Grain Overlay (z-index: 2) */}
      <div className="chat-background-grain" aria-hidden="true" />
      
      {/* Layer 4: Top/Bottom Vignette Gradient (z-index: 3) */}
      <div className="chat-background-vignette" aria-hidden="true" />

      {/* Hero Section with centered "Chat" heading (z-index: 10) */}
      <motion.section
        className="chat-hero"
        variants={heroVariants}
        initial="initial"
        animate="animate"
        aria-labelledby="chat-hero-title"
      >
        <motion.h1
          id="chat-hero-title"
          className="chat-hero-title"
          initial={reducedMotion ? {} : { opacity: 0, y: 10 }}
          animate={reducedMotion ? {} : { opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          Chat
        </motion.h1>
      </motion.section>

      {/* Main Content (z-index: 10+) */}
      <div className="chat-content-wrapper">
        {children}
      </div>
    </div>
  );
}
