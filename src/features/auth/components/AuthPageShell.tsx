'use client';

import { motion } from 'framer-motion';
import { useReducedMotion } from '@/lib/hooks';
import { motion as motionTokens } from '@/lib/design-system/motion';

interface AuthPageShellProps {
  children: React.ReactNode;
}

export default function AuthPageShell({ children }: AuthPageShellProps) {
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
    <div className="auth-page-shell">
      {/* Page Background Stack - Same as ChatPageShell */}
      {/* Layer 1: Background Image (z-index: -10) */}
      <div className="auth-background" aria-hidden="true" />
      
      {/* Layer 2: Soft Radial Bloom Behind Panel (z-index: -9) */}
      <div className="auth-background-bloom" aria-hidden="true" />
      
      {/* Layer 3: Ultra Subtle Grain Overlay (z-index: -8) */}
      <div className="auth-background-grain" aria-hidden="true" />
      
      {/* Layer 4: Top/Bottom Vignette Gradient (z-index: -7) */}
      <div className="auth-background-vignette" aria-hidden="true" />

      {/* Hero Section with centered brand and title (z-index: 10) */}
      <motion.section
        className="auth-hero"
        variants={heroVariants}
        initial="initial"
        animate="animate"
        aria-labelledby="auth-hero-title"
      >
        {children}
      </motion.section>
    </div>
  );
}
