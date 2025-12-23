/**
 * Rumi AI Motion System
 * 
 * Premium animation library built on Framer Motion.
 * Provides consistent, performant, and accessible animations.
 */

import { Variants, Transition, TargetAndTransition } from 'framer-motion';

// =============================================================================
// SPRING CONFIGURATIONS
// =============================================================================

export const springs = {
  /** Gentle spring for subtle movements */
  gentle: { type: 'spring', stiffness: 120, damping: 20 } as const,
  
  /** Snappy spring for responsive interactions */
  snappy: { type: 'spring', stiffness: 400, damping: 30 } as const,
  
  /** Bouncy spring for playful effects */
  bouncy: { type: 'spring', stiffness: 300, damping: 15 } as const,
  
  /** Stiff spring for quick responses */
  stiff: { type: 'spring', stiffness: 500, damping: 35 } as const,
  
  /** Soft spring for graceful movements */
  soft: { type: 'spring', stiffness: 100, damping: 25 } as const,
} as const;

// =============================================================================
// TWEEN CONFIGURATIONS
// =============================================================================

export const tweens = {
  /** Fast tween for micro-interactions */
  fast: { type: 'tween', duration: 0.15, ease: [0.16, 1, 0.3, 1] } as const,
  
  /** Normal tween for standard transitions */
  normal: { type: 'tween', duration: 0.3, ease: [0.16, 1, 0.3, 1] } as const,
  
  /** Slow tween for dramatic reveals */
  slow: { type: 'tween', duration: 0.5, ease: [0.16, 1, 0.3, 1] } as const,
  
  /** Smooth tween for premium feel */
  smooth: { type: 'tween', duration: 0.6, ease: [0.45, 0, 0.15, 1] } as const,
  
  /** Page transition tween */
  page: { type: 'tween', duration: 0.4, ease: [0.45, 0, 0.15, 1] } as const,
} as const;

// =============================================================================
// EASING CURVES
// =============================================================================

export const easings = {
  /** Expo out - fast start, slow end (premium feel) */
  outExpo: [0.16, 1, 0.3, 1] as const,
  
  /** Back out - slight overshoot */
  outBack: [0.34, 1.56, 0.64, 1] as const,
  
  /** Soft in-out - gentle both ways */
  inOutSoft: [0.45, 0, 0.15, 1] as const,
  
  /** Spring-like easing */
  spring: [0.175, 0.885, 0.32, 1.275] as const,
  
  /** Quint out - very smooth deceleration */
  outQuint: [0.22, 1, 0.36, 1] as const,
  
  /** Circ out - circular ease */
  outCirc: [0, 0.55, 0.45, 1] as const,
};

// =============================================================================
// REVEAL VARIANTS
// =============================================================================

/** Fade up reveal - most common */
export const fadeUp: Variants = {
  initial: { 
    opacity: 0, 
    y: 24,
    filter: 'blur(4px)',
  },
  animate: { 
    opacity: 1, 
    y: 0,
    filter: 'blur(0px)',
  },
  exit: { 
    opacity: 0, 
    y: -12,
    filter: 'blur(4px)',
  },
};

/** Fade down reveal */
export const fadeDown: Variants = {
  initial: { opacity: 0, y: -24 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 12 },
};

/** Fade in from left */
export const fadeLeft: Variants = {
  initial: { opacity: 0, x: -24 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 24 },
};

/** Fade in from right */
export const fadeRight: Variants = {
  initial: { opacity: 0, x: 24 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -24 },
};

/** Simple fade */
export const fade: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

/** Scale up reveal */
export const scaleUp: Variants = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
};

/** Scale down reveal (for modals, dropdowns) */
export const scaleDown: Variants = {
  initial: { opacity: 0, scale: 1.05 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 1.05 },
};

// =============================================================================
// STAGGER VARIANTS
// =============================================================================

/** Container with staggered children */
export const staggerContainer: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
  exit: {
    transition: {
      staggerChildren: 0.05,
      staggerDirection: -1,
    },
  },
};

/** Fast stagger for lists */
export const staggerFast: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.05,
    },
  },
};

/** Slow stagger for dramatic reveals */
export const staggerSlow: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.2,
    },
  },
};

/** Child item for stagger containers */
export const staggerChild: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 24,
    },
  },
  exit: { opacity: 0, y: 10 },
};

// =============================================================================
// HOVER & TAP VARIANTS
// =============================================================================

/** Card hover effect with 3D tilt */
export const cardHover: Variants = {
  rest: { 
    scale: 1, 
    y: 0,
    boxShadow: '0 4px 20px rgba(45, 55, 72, 0.08)',
  },
  hover: { 
    scale: 1.02, 
    y: -8,
    boxShadow: '0 12px 40px rgba(27, 123, 107, 0.15)',
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 25,
    },
  },
  tap: { 
    scale: 0.98,
    y: -4,
  },
};

/** Button hover/tap effect */
export const buttonHover: Variants = {
  rest: { scale: 1 },
  hover: { 
    scale: 1.02,
    transition: { type: 'spring', stiffness: 400, damping: 20 },
  },
  tap: { 
    scale: 0.98,
    transition: { type: 'spring', stiffness: 400, damping: 20 },
  },
};

/** Icon hover effect */
export const iconHover: Variants = {
  rest: { scale: 1, rotate: 0 },
  hover: { 
    scale: 1.1,
    rotate: 5,
    transition: { type: 'spring', stiffness: 300, damping: 15 },
  },
  tap: { scale: 0.95 },
};

/** Link underline effect */
export const linkUnderline: Variants = {
  rest: { 
    scaleX: 0,
    originX: 0,
  },
  hover: { 
    scaleX: 1,
    transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] },
  },
};

// =============================================================================
// PAGE TRANSITION VARIANTS
// =============================================================================

/** Default page transition */
export const pageTransition: Variants = {
  initial: { 
    opacity: 0, 
    y: 8,
    filter: 'blur(8px)',
  },
  animate: { 
    opacity: 1, 
    y: 0,
    filter: 'blur(0px)',
    transition: {
      duration: 0.4,
      ease: [0.45, 0, 0.15, 1],
    },
  },
  exit: { 
    opacity: 0,
    y: -8,
    filter: 'blur(8px)',
    transition: {
      duration: 0.3,
      ease: [0.45, 0, 0.15, 1],
    },
  },
};

/** Slide page transition */
export const pageSlide: Variants = {
  initial: { 
    opacity: 0, 
    x: 20,
  },
  animate: { 
    opacity: 1, 
    x: 0,
    transition: {
      duration: 0.4,
      ease: [0.45, 0, 0.15, 1],
    },
  },
  exit: { 
    opacity: 0,
    x: -20,
    transition: {
      duration: 0.3,
      ease: [0.45, 0, 0.15, 1],
    },
  },
};

// =============================================================================
// PARALLAX MOTION VALUES
// =============================================================================

export const parallaxSpeeds = {
  /** Background (slowest) */
  background: 0.2,
  /** Far elements */
  far: 0.3,
  /** Middle elements */
  mid: 0.5,
  /** Near elements */
  near: 0.7,
  /** Foreground (fastest) */
  foreground: 0.9,
} as const;

// =============================================================================
// SCROLL ANIMATION THRESHOLDS
// =============================================================================

export const viewportConfig = {
  /** Default viewport options for scroll reveals */
  default: {
    once: true,
    margin: '-100px 0px -100px 0px',
    amount: 0.2,
  },
  /** For hero sections */
  hero: {
    once: true,
    margin: '-50px 0px -50px 0px',
    amount: 0.1,
  },
  /** For cards and smaller elements */
  card: {
    once: true,
    margin: '-50px 0px -50px 0px',
    amount: 0.3,
  },
  /** For repeating animations */
  repeating: {
    once: false,
    margin: '-100px 0px -100px 0px',
    amount: 0.5,
  },
} as const;

// =============================================================================
// TRANSITION PRESETS
// =============================================================================

export const transitionPresets: Record<string, Transition> = {
  /** Default for most animations */
  default: {
    type: 'tween',
    duration: 0.3,
    ease: [0.16, 1, 0.3, 1],
  },
  /** For reveals */
  reveal: {
    type: 'tween',
    duration: 0.6,
    ease: [0.16, 1, 0.3, 1],
  },
  /** For interactive elements */
  interactive: {
    type: 'spring',
    stiffness: 400,
    damping: 25,
  },
  /** For page transitions */
  page: {
    type: 'tween',
    duration: 0.4,
    ease: [0.45, 0, 0.15, 1],
  },
  /** For accordion/collapse */
  collapse: {
    type: 'tween',
    duration: 0.3,
    ease: [0.4, 0, 0.2, 1],
  },
};

// =============================================================================
// REDUCED MOTION VARIANTS
// =============================================================================

/** Minimal animation for reduced motion preference */
export const reducedMotion: Variants = {
  initial: { opacity: 0 },
  animate: { 
    opacity: 1,
    transition: { duration: 0.01 },
  },
  exit: { 
    opacity: 0,
    transition: { duration: 0.01 },
  },
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Creates a stagger container with custom timing
 */
export function createStagger(
  staggerChildren: number = 0.1,
  delayChildren: number = 0.1
): Variants {
  return {
    initial: {},
    animate: {
      transition: { staggerChildren, delayChildren },
    },
    exit: {
      transition: { staggerChildren: staggerChildren / 2, staggerDirection: -1 },
    },
  };
}

/**
 * Creates a custom reveal variant
 */
export function createReveal(
  direction: 'up' | 'down' | 'left' | 'right' = 'up',
  distance: number = 24,
  blur: boolean = true
): Variants {
  const axis = direction === 'up' || direction === 'down' ? 'y' : 'x';
  const sign = direction === 'up' || direction === 'left' ? 1 : -1;
  
  return {
    initial: {
      opacity: 0,
      [axis]: distance * sign,
      ...(blur && { filter: 'blur(4px)' }),
    },
    animate: {
      opacity: 1,
      [axis]: 0,
      ...(blur && { filter: 'blur(0px)' }),
    },
    exit: {
      opacity: 0,
      [axis]: (distance / 2) * -sign,
      ...(blur && { filter: 'blur(4px)' }),
    },
  };
}

/**
 * Creates hover states for cards with 3D tilt
 */
export function createCardHover(
  liftY: number = -8,
  scale: number = 1.02,
  shadowColor: string = 'rgba(27, 123, 107, 0.15)'
): Variants {
  return {
    rest: {
      scale: 1,
      y: 0,
      boxShadow: '0 4px 20px rgba(45, 55, 72, 0.08)',
    },
    hover: {
      scale,
      y: liftY,
      boxShadow: `0 12px 40px ${shadowColor}`,
      transition: springs.snappy,
    },
    tap: {
      scale: 0.98,
      y: liftY / 2,
    },
  };
}

// =============================================================================
// ANIMATION COMPOSITIONS
// =============================================================================

/** 
 * Text character-by-character reveal
 * Use with split text for dramatic effect
 */
export const textReveal = {
  container: {
    initial: {},
    animate: {
      transition: {
        staggerChildren: 0.03,
        delayChildren: 0.1,
      },
    },
  } as Variants,
  character: {
    initial: { opacity: 0, y: 20 },
    animate: {
      opacity: 1,
      y: 0,
      transition: {
        type: 'spring',
        stiffness: 400,
        damping: 30,
      },
    },
  } as Variants,
};

/**
 * Counter/number animation
 */
export const numberCount: Variants = {
  initial: { opacity: 0, scale: 0.5 },
  animate: {
    opacity: 1,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 20,
    },
  },
};

/**
 * Draw SVG path animation
 */
export const drawPath: Variants = {
  initial: { pathLength: 0, opacity: 0 },
  animate: {
    pathLength: 1,
    opacity: 1,
    transition: {
      pathLength: { duration: 1, ease: [0.16, 1, 0.3, 1] },
      opacity: { duration: 0.3 },
    },
  },
};

// =============================================================================
// EXPORT ALL
// =============================================================================

export const motion = {
  springs,
  tweens,
  easings,
  variants: {
    fadeUp,
    fadeDown,
    fadeLeft,
    fadeRight,
    fade,
    scaleUp,
    scaleDown,
    staggerContainer,
    staggerFast,
    staggerSlow,
    staggerChild,
    cardHover,
    buttonHover,
    iconHover,
    linkUnderline,
    pageTransition,
    pageSlide,
    reducedMotion,
    textReveal,
    numberCount,
    drawPath,
  },
  parallaxSpeeds,
  viewportConfig,
  transitionPresets,
  createStagger,
  createReveal,
  createCardHover,
} as const;

export default motion;
