'use client';

import { ReactNode } from 'react';
import { motion, Variants } from 'framer-motion';
import { useReducedMotion } from '@/lib/hooks/use-reduced-motion';
import { easings } from '@/lib/design-system/motion';

// =============================================================================
// TYPES
// =============================================================================

export interface FadeUpProps {
  /** Content to animate */
  children: ReactNode;
  /** Delay before animation starts (in seconds) */
  delay?: number;
  /** Animation duration (in seconds) */
  duration?: number;
  /** Y offset to animate from */
  offset?: number;
  /** Additional className */
  className?: string;
  /** Whether to animate when component enters viewport */
  once?: boolean;
  /** Amount of element visible before triggering (0-1) */
  amount?: number;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function FadeUp({
  children,
  delay = 0,
  duration = 0.3,
  offset = 24,
  className = '',
  once = true,
  amount = 0.3,
}: FadeUpProps) {
  const prefersReducedMotion = useReducedMotion();

  const variants: Variants = {
    hidden: {
      opacity: 0,
      y: prefersReducedMotion ? 0 : offset,
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: prefersReducedMotion ? 0 : duration,
        delay: prefersReducedMotion ? 0 : delay,
        ease: easings.outExpo,
      },
    },
  };

  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once, amount }}
      variants={variants}
    >
      {children}
    </motion.div>
  );
}

// =============================================================================
// STAGGER CONTAINER
// =============================================================================

export interface StaggerContainerProps {
  /** Content to animate (should contain FadeUp or similar animated children) */
  children: ReactNode;
  /** Delay between each child animation */
  staggerDelay?: number;
  /** Initial delay before stagger starts */
  delayChildren?: number;
  /** Additional className */
  className?: string;
  /** Whether to animate when component enters viewport */
  once?: boolean;
  /** Amount of element visible before triggering (0-1) */
  amount?: number;
}

export function StaggerContainer({
  children,
  staggerDelay = 0.1,
  delayChildren = 0.2,
  className = '',
  once = true,
  amount = 0.2,
}: StaggerContainerProps) {
  const prefersReducedMotion = useReducedMotion();

  const containerVariants: Variants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: prefersReducedMotion ? 0 : staggerDelay,
        delayChildren: prefersReducedMotion ? 0 : delayChildren,
      },
    },
  };

  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once, amount }}
      variants={containerVariants}
    >
      {children}
    </motion.div>
  );
}

// =============================================================================
// STAGGER ITEM (for use inside StaggerContainer)
// =============================================================================

export interface StaggerItemProps {
  /** Content to animate */
  children: ReactNode;
  /** Y offset to animate from */
  offset?: number;
  /** Additional className */
  className?: string;
}

export function StaggerItem({
  children,
  offset = 24,
  className = '',
}: StaggerItemProps) {
  const prefersReducedMotion = useReducedMotion();

  const itemVariants: Variants = {
    hidden: {
      opacity: 0,
      y: prefersReducedMotion ? 0 : offset,
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.3,
        ease: easings.outExpo,
      },
    },
  };

  return (
    <motion.div className={className} variants={itemVariants}>
      {children}
    </motion.div>
  );
}

// =============================================================================
// EXPORTS
// =============================================================================

export default FadeUp;
