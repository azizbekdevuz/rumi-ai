'use client';

import { useState, useEffect } from 'react';

/**
 * Hook to detect user's reduced motion preference.
 * Returns true if the user prefers reduced motion.
 * 
 * Usage:
 * ```tsx
 * const prefersReducedMotion = useReducedMotion();
 * const variants = prefersReducedMotion ? reducedMotion : fadeUp;
 * ```
 */
export function useReducedMotion(): boolean {
  // Lazy initialization to avoid setState in effect
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() => {
    if (typeof window === 'undefined') return false;
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    return mediaQuery.matches;
  });

  useEffect(() => {
    // Check if window is available (client-side)
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    // Listen for changes
    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } else {
      // Legacy browsers (Safari < 14)
      mediaQuery.addListener(handleChange);
      return () => mediaQuery.removeListener(handleChange);
    }
  }, []);

  return prefersReducedMotion;
}

/**
 * Returns appropriate motion variants based on reduced motion preference.
 * Automatically switches to minimal animations when user prefers reduced motion.
 */
export function useAccessibleMotion<T>(
  fullMotion: T,
  reducedMotion: T
): T {
  const prefersReducedMotion = useReducedMotion();
  return prefersReducedMotion ? reducedMotion : fullMotion;
}

export default useReducedMotion;
