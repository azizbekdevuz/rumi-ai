'use client';

import { forwardRef, ButtonHTMLAttributes, ReactNode } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { useReducedMotion } from '@/lib/hooks/use-reduced-motion';
import { springs } from '@/lib/design-system/motion';

// =============================================================================
// TYPES
// =============================================================================

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'gold' | 'outline';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'xl';

export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'style'> {
  /** Visual style variant */
  variant?: ButtonVariant;
  /** Size of the button */
  size?: ButtonSize;
  /** Icon to display before text */
  leftIcon?: ReactNode;
  /** Icon to display after text */
  rightIcon?: ReactNode;
  /** Full width button */
  fullWidth?: boolean;
  /** Loading state */
  isLoading?: boolean;
  /** Pill shape (fully rounded) */
  pill?: boolean;
  /** Custom className */
  className?: string;
  /** Children */
  children: ReactNode;
}

// =============================================================================
// STYLES
// =============================================================================

const baseStyles = `
  relative inline-flex items-center justify-center gap-2
  font-medium transition-colors
  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
  disabled:pointer-events-none disabled:opacity-50
  overflow-hidden
`;

const variantStyles: Record<ButtonVariant, string> = {
  primary: `
    text-white
    focus-visible:ring-[var(--accent-teal)]
  `,
  secondary: `
    bg-[var(--bg-secondary)] text-[var(--text-primary)]
    border border-[var(--border-color)]
    hover:bg-[var(--bg-tertiary)]
    focus-visible:ring-[var(--accent-teal)]
  `,
  ghost: `
    bg-transparent text-[var(--text-secondary)]
    hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]
    focus-visible:ring-[var(--accent-teal)]
  `,
  gold: `
    text-[#3d2817]
    focus-visible:ring-[var(--accent-gold)]
  `,
  outline: `
    bg-transparent text-[var(--accent-teal)]
    border-2 border-[var(--accent-teal)]
    hover:bg-[var(--accent-teal-light)]
    focus-visible:ring-[var(--accent-teal)]
  `,
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-sm',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-6 text-base',
  xl: 'h-14 px-8 text-lg',
};

// =============================================================================
// COMPONENT
// =============================================================================

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      leftIcon,
      rightIcon,
      fullWidth = false,
      isLoading = false,
      pill = false,
      className = '',
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const prefersReducedMotion = useReducedMotion();

    const radiusClass = pill ? 'rounded-full' : 'rounded-[var(--radius-md)]';
    const widthClass = fullWidth ? 'w-full' : '';

    // Motion variants for hover/tap
    const motionVariants = {
      rest: { scale: 1 },
      hover: { scale: prefersReducedMotion ? 1 : 1.02 },
      tap: { scale: prefersReducedMotion ? 1 : 0.98 },
    };

    // Special styles for gradient variants - 3D realistic appearance
    const getVariantStyle = () => {
      if (variant === 'primary') {
        return {
          background: 'linear-gradient(180deg, #248f8f 0%, #1B7B6B 50%, #156358 100%)',
          boxShadow: `
            0 1px 0 rgba(255, 255, 255, 0.2) inset,
            0 2px 4px rgba(0, 0, 0, 0.15),
            0 6px 12px rgba(27, 123, 107, 0.3),
            0 12px 24px rgba(27, 123, 107, 0.2)
          `,
          border: '1px solid rgba(21, 99, 88, 0.8)',
        };
      }
      if (variant === 'gold') {
        return {
          background: 'linear-gradient(180deg, #E8C15D 0%, #D4A84B 50%, #B8923D 100%)',
          boxShadow: `
            0 1px 0 rgba(255, 255, 255, 0.4) inset,
            0 0 0 2px rgba(184, 146, 61, 0.5),
            0 3px 6px rgba(0, 0, 0, 0.2),
            0 8px 16px rgba(201, 146, 44, 0.4),
            0 16px 32px rgba(201, 146, 44, 0.3)
          `,
          border: '1px solid rgba(184, 146, 61, 0.8)',
          textShadow: '0 1px 0 rgba(255, 255, 255, 0.3)',
        };
      }
      return {};
    };

    return (
      <motion.button
        ref={ref}
        className={`
          ${baseStyles}
          ${variantStyles[variant]}
          ${sizeStyles[size]}
          ${radiusClass}
          ${widthClass}
          ${className}
        `.replace(/\s+/g, ' ').trim()}
        style={getVariantStyle()}
        variants={motionVariants}
        initial="rest"
        whileHover="hover"
        whileTap="tap"
        transition={springs.snappy}
        disabled={disabled || isLoading}
        {...(props as HTMLMotionProps<'button'>)}
      >
        {/* Glossy top highlight for 3D effect */}
        {(variant === 'primary' || variant === 'gold') && (
          <span
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.15) 0%, transparent 50%)',
              borderRadius: 'inherit',
            }}
          />
        )}
        
        {/* Glow effect overlay on hover */}
        {(variant === 'primary' || variant === 'gold') && (
          <motion.span
            className="absolute inset-0 opacity-0 pointer-events-none"
            style={{
              background: variant === 'gold' 
                ? 'radial-gradient(circle at center, rgba(255,255,255,0.3) 0%, transparent 70%)'
                : 'radial-gradient(circle at center, rgba(255,255,255,0.2) 0%, transparent 70%)',
              borderRadius: 'inherit',
            }}
            variants={{
              rest: { opacity: 0 },
              hover: { opacity: 1 },
            }}
            transition={{ duration: 0.3 }}
          />
        )}

        {/* Loading spinner */}
        {isLoading && (
          <motion.span
            className="absolute inset-0 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <LoadingSpinner />
          </motion.span>
        )}

        {/* Content */}
        <span 
          className={`relative flex items-center gap-2 ${isLoading ? 'opacity-0' : ''}`}
        >
          {leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
          {children}
          {rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
        </span>
      </motion.button>
    );
  }
);

Button.displayName = 'Button';

// =============================================================================
// LOADING SPINNER
// =============================================================================

function LoadingSpinner() {
  return (
    <svg
      className="animate-spin h-5 w-5"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

// =============================================================================
// EXPORTS
// =============================================================================

export { Button };
export default Button;
