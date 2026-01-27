'use client';

import { forwardRef, HTMLAttributes, ReactNode, useRef, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { useReducedMotion } from '@/lib/hooks/use-reduced-motion';

// =============================================================================
// TYPES
// =============================================================================

export type CardVariant = 'default' | 'elevated' | 'outlined' | 'glass';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Visual style variant */
  variant?: CardVariant;
  /** Enable 3D tilt effect on hover */
  tiltEffect?: boolean;
  /** Maximum tilt angle in degrees */
  maxTilt?: number;
  /** Custom className */
  className?: string;
  /** Card content */
  children: ReactNode;
  /** Make card clickable/interactive */
  interactive?: boolean;
  /** Glow color on hover (CSS color value) */
  glowColor?: string;
}

// =============================================================================
// STYLES
// =============================================================================

const baseStyles = `
  relative overflow-hidden
  rounded-[var(--radius-lg)]
  transition-colors
`;

const variantStyles: Record<CardVariant, string> = {
  default: `
    bg-[var(--bg-primary)]
    border border-[var(--border-color)]
  `,
  elevated: `
    bg-[var(--bg-primary)]
  `,
  outlined: `
    bg-transparent
    border-2 border-[var(--border-color)]
  `,
  glass: `
    bg-[var(--bg-primary)]/80
    backdrop-blur-md
    border border-[var(--border-color)]/50
  `,
};

// =============================================================================
// COMPONENT
// =============================================================================

const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      variant = 'default',
      tiltEffect = true,
      maxTilt = 10,
      className = '',
      children,
      interactive = true,
      glowColor = 'var(--accent-teal)',
      // Exclude animation props that conflict with motion.div
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      onAnimationStart: _onAnimationStart,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      onAnimationEnd: _onAnimationEnd,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      onAnimationIteration: _onAnimationIteration,
      // Exclude drag props that conflict with motion.div
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      onDrag: _onDrag,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      onDragStart: _onDragStart,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      onDragEnd: _onDragEnd,
      ...props
    },
    ref
  ) => {
    const prefersReducedMotion = useReducedMotion();
    const cardRef = useRef<HTMLDivElement>(null);
    const [isHovered, setIsHovered] = useState(false);

    // Motion values for tilt effect
    const x = useMotionValue(0);
    const y = useMotionValue(0);

    // Spring config for smooth movement
    const springConfig = { stiffness: 300, damping: 30 };
    const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [maxTilt, -maxTilt]), springConfig);
    const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-maxTilt, maxTilt]), springConfig);

    // Handle mouse movement for tilt
    const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
      if (!cardRef.current || prefersReducedMotion || !tiltEffect || !interactive) return;

      const rect = cardRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      const mouseX = event.clientX - centerX;
      const mouseY = event.clientY - centerY;
      
      const normalizedX = mouseX / (rect.width / 2);
      const normalizedY = mouseY / (rect.height / 2);
      
      x.set(normalizedX);
      y.set(normalizedY);
    };

    const handleMouseLeave = () => {
      setIsHovered(false);
      x.set(0);
      y.set(0);
    };

    const handleMouseEnter = () => {
      setIsHovered(true);
    };

    // Shadow based on variant and hover state
    const getShadowStyle = () => {
      if (variant === 'elevated') {
        return {
          boxShadow: isHovered 
            ? '0 20px 40px rgba(45, 55, 72, 0.15), 0 8px 16px rgba(27, 123, 107, 0.1)'
            : '0 4px 20px rgba(45, 55, 72, 0.08)',
        };
      }
      if (interactive && isHovered) {
        return {
          boxShadow: '0 12px 32px rgba(45, 55, 72, 0.12)',
        };
      }
      return {};
    };

    // Determine if we should apply 3D transforms
    const shouldTilt = tiltEffect && interactive && !prefersReducedMotion;

    return (
      <motion.div
        ref={(node) => {
          // Handle both refs
          (cardRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
          if (typeof ref === 'function') {
            ref(node);
          } else if (ref) {
            ref.current = node;
          }
        }}
        className={`
          ${baseStyles}
          ${variantStyles[variant]}
          ${interactive ? 'cursor-pointer' : ''}
          ${className}
        `.replace(/\s+/g, ' ').trim()}
        style={{
          ...getShadowStyle(),
          transformStyle: shouldTilt ? 'preserve-3d' : undefined,
          perspective: shouldTilt ? '1000px' : undefined,
        }}
        animate={{
          scale: interactive && isHovered && !prefersReducedMotion ? 1.02 : 1,
          y: interactive && isHovered && !prefersReducedMotion ? -4 : 0,
          rotateX: shouldTilt ? rotateX.get() : 0,
          rotateY: shouldTilt ? rotateY.get() : 0,
        }}
        transition={{
          scale: { type: 'spring', stiffness: 400, damping: 30 },
          y: { type: 'spring', stiffness: 400, damping: 30 },
        }}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        {...props}
      >
        {/* Subtle glow effect on hover */}
        {interactive && (
          <motion.div
            className="absolute inset-0 pointer-events-none rounded-[inherit]"
            style={{
              background: `radial-gradient(
                600px circle at var(--mouse-x, 50%) var(--mouse-y, 50%),
                ${glowColor}10 0%,
                transparent 40%
              )`,
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: isHovered ? 1 : 0 }}
            transition={{ duration: 0.3 }}
          />
        )}

        {/* Card content */}
        <div className="relative z-10">
          {children}
        </div>

        {/* Border glow on hover */}
        {interactive && (
          <motion.div
            className="absolute inset-0 pointer-events-none rounded-[inherit]"
            style={{
              border: `1px solid ${glowColor}`,
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: isHovered ? 0.3 : 0 }}
            transition={{ duration: 0.3 }}
          />
        )}
      </motion.div>
    );
  }
);

Card.displayName = 'Card';

// =============================================================================
// CARD HEADER / CONTENT / FOOTER
// =============================================================================

interface CardSectionProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  className?: string;
}

export function CardHeader({ children, className = '', ...props }: CardSectionProps) {
  return (
    <div className={`px-6 py-4 border-b border-[var(--border-color)] ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardContent({ children, className = '', ...props }: CardSectionProps) {
  return (
    <div className={`px-6 py-5 ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({ children, className = '', ...props }: CardSectionProps) {
  return (
    <div className={`px-6 py-4 border-t border-[var(--border-color)] bg-[var(--bg-secondary)]/50 ${className}`} {...props}>
      {children}
    </div>
  );
}

// =============================================================================
// EXPORTS
// =============================================================================

export { Card };
export default Card;
