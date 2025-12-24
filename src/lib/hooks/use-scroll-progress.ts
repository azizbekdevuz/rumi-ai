'use client';

import { useState, useEffect, RefObject } from 'react';

/**
 * Hook to track scroll progress of the page (0 to 1).
 */
export function useScrollProgress(): number {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const updateProgress = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollProgress = docHeight > 0 ? scrollTop / docHeight : 0;
      setProgress(Math.min(1, Math.max(0, scrollProgress)));
    };

    // Initial calculation
    updateProgress();

    // Throttled scroll handler
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          updateProgress();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', updateProgress);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', updateProgress);
    };
  }, []);

  return progress;
}

/**
 * Hook to track element's visibility progress in viewport.
 * Returns 0 when element enters viewport, 1 when it leaves.
 */
export function useElementProgress(
  ref: RefObject<HTMLElement>,
  options: {
    offset?: number; // Offset in pixels from top of viewport
    threshold?: number; // Progress threshold
  } = {}
): number {
  const [progress, setProgress] = useState(0);
  const { offset = 0, threshold = 0 } = options;

  useEffect(() => {
    if (typeof window === 'undefined' || !ref.current) return;

    const element = ref.current;

    const updateProgress = () => {
      const rect = element.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      
      // Calculate progress from when element enters to when it leaves viewport
      const elementTop = rect.top - windowHeight + offset;
      const elementHeight = rect.height + windowHeight;
      
      const elementProgress = -elementTop / elementHeight;
      setProgress(Math.min(1, Math.max(0, elementProgress)));
    };

    // Initial calculation
    updateProgress();

    // Throttled scroll handler
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          updateProgress();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', updateProgress);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', updateProgress);
    };
  }, [ref, offset, threshold]);

  return progress;
}

/**
 * Hook to check if an element is in viewport.
 */
export function useInView(
  ref: RefObject<HTMLElement>,
  options: {
    threshold?: number;
    rootMargin?: string;
    once?: boolean;
  } = {}
): boolean {
  const [isInView, setIsInView] = useState(false);
  const { threshold = 0.1, rootMargin = '0px', once = true } = options;

  useEffect(() => {
    if (typeof window === 'undefined' || !ref.current) return;

    const element = ref.current;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          if (once) {
            observer.unobserve(element);
          }
        } else if (!once) {
          setIsInView(false);
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [ref, threshold, rootMargin, once]);

  return isInView;
}

/**
 * Hook to get parallax transform value based on scroll.
 * Returns a CSS transform value for use in inline styles.
 */
export function useParallax(speed: number = 0.5): string {
  const progress = useScrollProgress();
  const offset = progress * speed * 100;
  return `translateY(${offset}px)`;
}

export default useScrollProgress;
