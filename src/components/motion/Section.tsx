'use client';

import { forwardRef, HTMLAttributes, ReactNode } from 'react';
import { motion, Variants } from 'framer-motion';
import { useReducedMotion } from '@/lib/hooks/use-reduced-motion';
import { tweens, easings } from '@/lib/design-system/motion';

// =============================================================================
// TYPES
// =============================================================================

export interface SectionProps extends HTMLAttributes<HTMLElement> {
  /** Section content */
  children: ReactNode;
  /** Additional className */
  className?: string;
  /** Enable scroll-triggered reveal animation */
  animate?: boolean;
  /** Animation delay */
  delay?: number;
  /** ID for aria-labelledby */
  'aria-labelledby'?: string;
  /** Background variant */
  background?: 'none' | 'subtle' | 'accent';
}

// =============================================================================
// COMPONENT
// =============================================================================

export const Section = forwardRef<HTMLElement, SectionProps>(
  (
    {
      children,
      className = '',
      animate = true,
      delay = 0,
      background = 'none',
      ...props
    },
    ref
  ) => {
    const prefersReducedMotion = useReducedMotion();

    const variants: Variants = {
      hidden: {
        opacity: 0,
      },
      visible: {
        opacity: 1,
        transition: {
          duration: prefersReducedMotion ? 0 : 0.5,
          delay: prefersReducedMotion ? 0 : delay,
          ease: easings.outExpo,
        },
      },
    };

    const bgClasses = {
      none: '',
      subtle: 'bg-[var(--bg-secondary)]/30',
      accent: 'bg-[var(--accent-teal-light)]',
    };

    if (!animate || prefersReducedMotion) {
      return (
        <section
          ref={ref}
          className={`py-20 lg:py-28 ${bgClasses[background]} ${className}`}
          {...props}
        >
          {children}
        </section>
      );
    }

    return (
      <motion.section
        ref={ref}
        className={`py-20 lg:py-28 ${bgClasses[background]} ${className}`}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.1 }}
        variants={variants}
        aria-labelledby={props['aria-labelledby']}
      >
        {children}
      </motion.section>
    );
  }
);

Section.displayName = 'Section';

// =============================================================================
// CONTAINER
// =============================================================================

export interface ContainerProps extends HTMLAttributes<HTMLDivElement> {
  /** Container content */
  children: ReactNode;
  /** Additional className */
  className?: string;
  /** Max width variant */
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

const containerSizes = {
  sm: 'max-w-2xl',
  md: 'max-w-4xl',
  lg: 'max-w-6xl',
  xl: 'max-w-7xl',
  full: 'max-w-full',
};

export function Container({
  children,
  className = '',
  size = 'xl',
  ...props
}: ContainerProps) {
  return (
    <div
      className={`mx-auto px-4 sm:px-6 lg:px-8 ${containerSizes[size]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

// =============================================================================
// EXPORTS
// =============================================================================

export default Section;
