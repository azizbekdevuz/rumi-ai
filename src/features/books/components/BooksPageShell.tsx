'use client';

import { motion } from 'framer-motion';
import { useReducedMotion } from '@/lib/hooks';
import { motion as motionTokens } from '@/lib/design-system/motion';

interface BooksPageShellProps {
  children: React.ReactNode;
}

export default function BooksPageShell({ children }: BooksPageShellProps) {
  const reducedMotion = useReducedMotion();

  const heroVariants = reducedMotion
    ? motionTokens.variants.reducedMotion
    : {
        initial: { opacity: 0, y: 20 },
        animate: {
          opacity: 1,
          y: 0,
          transition: {
            duration: 0.6,
            ease: [0.45, 0, 0.15, 1] as const,
          },
        },
      };

  return (
    <div className="books-page-shell">
      {/* Page Background Stack - Same as ChatPageShell */}
      {/* Layer 1: Background Image (z-index: 0) */}
      <div className="books-background" aria-hidden="true" />
      
      {/* Layer 2: Soft Radial Bloom Behind Panel (z-index: 1) */}
      <div className="books-background-bloom" aria-hidden="true" />
      
      {/* Layer 3: Ultra Subtle Grain Overlay (z-index: 2) */}
      <div className="books-background-grain" aria-hidden="true" />
      
      {/* Layer 4: Top/Bottom Vignette Gradient (z-index: 3) */}
      <div className="books-background-vignette" aria-hidden="true" />

      {/* Hero Section with centered "Books" heading (z-index: 10) */}
      <motion.section
        className="books-hero"
        variants={heroVariants}
        initial="initial"
        animate="animate"
        aria-labelledby="books-hero-title"
      >
        <motion.h1
          id="books-hero-title"
          className="books-hero-title"
          initial={reducedMotion ? {} : { opacity: 0, y: 10 }}
          animate={reducedMotion ? {} : { opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          Books
        </motion.h1>
      </motion.section>

      {/* Main Content (z-index: 10+) */}
      <div className="books-content-wrapper">
        {children}
      </div>
    </div>
  );
}
