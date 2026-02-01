'use client';

import { motion } from 'framer-motion';
import { useReducedMotion } from '@/lib/hooks/use-reduced-motion';

/**
 * Background component that creates an atmospheric Persian-inspired backdrop
 * with mosque silhouettes, subtle patterns, warm earthy gradients.
 * Optimized: Removed scroll-based parallax for better performance.
 * Visual appearance maintained with CSS-only animations.
 */
export default function Background() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div className="background-wrapper" aria-hidden="true">
      {/* Watercolor texture base - fixed background image */}
      <div className="bg-image-layer" />
      
      {/* Animated gradient overlay for motion and depth */}
      <motion.div 
        className="bg-gradient-overlay"
        animate={prefersReducedMotion ? undefined : {
          opacity: [0.85, 0.92, 0.85],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
      
      {/* Additional gradient base layer */}
      <div className="bg-gradient-base" />
      
      {/* Clouds / mist effect - CSS-only subtle movement */}
      <div className="bg-clouds">
        <motion.div 
          className="cloud cloud-1"
          animate={prefersReducedMotion ? undefined : {
            x: [0, 50, 0],
          }}
          transition={{
            duration: 60,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
        <motion.div 
          className="cloud cloud-2"
          animate={prefersReducedMotion ? undefined : {
            x: [0, -30, 0],
          }}
          transition={{
            duration: 45,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
        <motion.div 
          className="cloud cloud-3"
          animate={prefersReducedMotion ? undefined : {
            x: [0, 40, 0],
          }}
          transition={{
            duration: 75,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
      </div>

      {/* Floating birds - CSS-only subtle movement */}
      <svg
        className="bg-birds"
        viewBox="0 0 200 100"
        xmlns="http://www.w3.org/2000/svg"
      >
        <motion.g
          animate={prefersReducedMotion ? undefined : {
            y: [0, -5, 0],
            x: [0, 10, 0],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          <path d="M20 40 Q25 35 30 40 Q35 35 40 40" stroke="currentColor" strokeWidth="1.5" fill="none" />
          <path d="M60 30 Q65 25 70 30 Q75 25 80 30" stroke="currentColor" strokeWidth="1.5" fill="none" />
          <path d="M100 45 Q105 40 110 45 Q115 40 120 45" stroke="currentColor" strokeWidth="1.5" fill="none" />
          <path d="M140 35 Q145 30 150 35 Q155 30 160 35" stroke="currentColor" strokeWidth="1.5" fill="none" />
          <path d="M170 50 Q175 45 180 50 Q185 45 190 50" stroke="currentColor" strokeWidth="1.5" fill="none" />
        </motion.g>
      </svg>

      {/* Architectural silhouette - left side */}
      <svg
        className="bg-architecture bg-architecture-left"
        viewBox="0 0 400 300"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMinYMax slice"
      >
        {/* Mosque dome */}
        <path
          d="M80 300V220C80 220 80 180 120 160C160 140 160 100 160 100C160 100 160 140 200 160C240 180 240 220 240 220V300"
          fill="currentColor"
        />
        {/* Minaret left */}
        <path
          d="M20 300V200C20 200 20 180 40 170C40 170 60 180 60 200V300"
          fill="currentColor"
        />
        {/* Minaret tower */}
        <path d="M35 170V140L40 130L45 140V170" fill="currentColor" />
        {/* Small dome decoration */}
        <ellipse cx="40" cy="130" rx="8" ry="6" fill="currentColor" />
        {/* Minaret right */}
        <path
          d="M260 300V220C260 220 260 200 280 190C280 190 300 200 300 220V300"
          fill="currentColor"
        />
        <path d="M275 190V160L280 150L285 160V190" fill="currentColor" />
        <ellipse cx="280" cy="150" rx="8" ry="6" fill="currentColor" />
        {/* Additional building */}
        <path d="M320 300V260L340 240L360 260V300" fill="currentColor" />
      </svg>

      {/* Architectural silhouette - right side */}
      <svg
        className="bg-architecture bg-architecture-right"
        viewBox="0 0 400 300"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMaxYMax slice"
      >
        {/* Main dome */}
        <path
          d="M200 300V200C200 200 200 160 250 140C300 120 300 80 300 80C300 80 300 120 350 140C400 160 400 200 400 200V300"
          fill="currentColor"
        />
        {/* Tower */}
        <path
          d="M100 300V240C100 240 100 220 120 210C120 210 140 220 140 240V300"
          fill="currentColor"
        />
        <path d="M115 210V180L120 170L125 180V210" fill="currentColor" />
        <ellipse cx="120" cy="170" rx="8" ry="6" fill="currentColor" />
        {/* Golden dome accent */}
        <ellipse cx="300" cy="90" rx="25" ry="18" fill="currentColor" className="golden-dome" />
      </svg>

      {/* Subtle geometric pattern overlay */}
      <div className="bg-pattern" />
      
      {/* Vignette effect for depth */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.02) 100%)',
        }}
      />
    </div>
  );
}
