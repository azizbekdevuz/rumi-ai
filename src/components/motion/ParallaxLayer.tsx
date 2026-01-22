'use client';

import { ReactNode, useRef } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import { useReducedMotion } from '@/lib/hooks/use-reduced-motion';

// =============================================================================
// TYPES
// =============================================================================

export interface ParallaxLayerProps {
  /** Content to parallax */
  children: ReactNode;
  /** Parallax speed multiplier (0 = no movement, 1 = full scroll, negative = opposite) */
  speed?: number;
  /** Additional className */
  className?: string;
  /** Direction of parallax movement */
  direction?: 'vertical' | 'horizontal';
  /** Custom offset range [start, end] in pixels */
  offset?: [number, number];
  /** Enable smooth spring animation */
  smooth?: boolean;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function ParallaxLayer({
  children,
  speed = 0.5,
  className = '',
  direction = 'vertical',
  offset,
  smooth = true,
}: ParallaxLayerProps) {
  const prefersReducedMotion = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });

  // Calculate transform based on speed
  const range = offset || [speed * -100, speed * 100];
  const transform = useTransform(scrollYProgress, [0, 1], range);
  
  // Apply spring for smooth movement
  const springConfig = { stiffness: 100, damping: 30, restDelta: 0.001 };
  const smoothTransform = useSpring(transform, springConfig);

  const finalTransform = smooth ? smoothTransform : transform;

  // Disable parallax for reduced motion
  if (prefersReducedMotion) {
    return (
      <div ref={ref} className={className}>
        {children}
      </div>
    );
  }

  const motionStyle = direction === 'vertical'
    ? { y: finalTransform }
    : { x: finalTransform };

  return (
    <div ref={ref} className={`relative ${className}`}>
      <motion.div style={motionStyle}>
        {children}
      </motion.div>
    </div>
  );
}

// =============================================================================
// PARALLAX CONTAINER (for layered parallax backgrounds)
// =============================================================================

export interface ParallaxContainerProps {
  /** Parallax layers */
  children: ReactNode;
  /** Additional className */
  className?: string;
  /** Fixed height for the parallax area */
  height?: string;
}

export function ParallaxContainer({
  children,
  className = '',
  height = '100vh',
}: ParallaxContainerProps) {
  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{ height }}
    >
      {children}
    </div>
  );
}

// =============================================================================
// SCROLL PROGRESS BAR
// =============================================================================

export interface ScrollProgressBarProps {
  /** Bar color */
  color?: string;
  /** Bar height */
  height?: number;
  /** Position (top or bottom) */
  position?: 'top' | 'bottom';
  /** Additional className */
  className?: string;
}

export function ScrollProgressBar({
  color = 'var(--accent-teal)',
  height = 3,
  position = 'top',
  className = '',
}: ScrollProgressBarProps) {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });

  return (
    <motion.div
      className={`fixed left-0 right-0 z-50 origin-left ${className}`}
      style={{
        [position]: 0,
        height,
        backgroundColor: color,
        scaleX,
      }}
    />
  );
}

// =============================================================================
// EXPORTS
// =============================================================================

export default ParallaxLayer;
