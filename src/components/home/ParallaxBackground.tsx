'use client';

import { useRef } from 'react';
import { motion, useScroll, useTransform, useSpring, MotionValue } from 'framer-motion';
import { useReducedMotion } from '@/lib/hooks/use-reduced-motion';

// =============================================================================
// HELPER HOOK: Create smooth parallax transform
// =============================================================================

function useParallaxTransform(
  scrollYProgress: MotionValue<number>,
  speed: number,
  direction: 'up' | 'down' = 'up'
) {
  const range = direction === 'up' ? [0, -speed * 100] : [0, speed * 100];
  const transform = useTransform(scrollYProgress, [0, 1], range);
  return useSpring(transform, { stiffness: 100, damping: 30 });
}

// =============================================================================
// CLOUD COMPONENT
// =============================================================================

interface CloudProps {
  className?: string;
  scrollYProgress: MotionValue<number>;
  speed: number;
  opacity?: number;
  blur?: number;
}

function Cloud({ className = '', scrollYProgress, speed, opacity = 0.4, blur = 40 }: CloudProps) {
  const y = useParallaxTransform(scrollYProgress, speed, 'up');
  
  return (
    <motion.div
      className={`absolute pointer-events-none ${className}`}
      style={{
        y,
        background: `radial-gradient(ellipse, rgba(255, 255, 255, ${opacity}) 0%, transparent 70%)`,
        borderRadius: '50%',
        filter: `blur(${blur}px)`,
      }}
    />
  );
}

// =============================================================================
// BIRD SVG COMPONENT
// =============================================================================

function BirdSVG({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
    >
      <path d="M12 4C8 4 5 7 5 11c0 2 1 4 3 5l-4 5h20l-4-5c2-1 3-3 3-5 0-4-3-7-7-7z" />
    </svg>
  );
}

// =============================================================================
// FLYING BIRDS COMPONENT
// =============================================================================

interface FlyingBirdsProps {
  scrollYProgress: MotionValue<number>;
}

function FlyingBirds({ scrollYProgress }: FlyingBirdsProps) {
  const prefersReducedMotion = useReducedMotion();
  const y = useParallaxTransform(scrollYProgress, 0.3, 'up');
  const x = useParallaxTransform(scrollYProgress, 0.1, 'down');
  
  if (prefersReducedMotion) {
    return (
      <div className="absolute top-[15%] left-1/2 -translate-x-1/2 w-[300px] h-auto opacity-[0.08]">
        <div className="flex gap-4 justify-center">
          {[...Array(5)].map((_, i) => (
            <BirdSVG key={i} className={`w-4 h-4 ${i % 2 === 0 ? '-translate-y-2' : ''}`} />
          ))}
        </div>
      </div>
    );
  }
  
  return (
    <motion.div
      className="absolute top-[15%] left-1/2 -translate-x-1/2 w-[300px]"
      style={{ y, x }}
    >
      <motion.div 
        className="flex gap-4 justify-center opacity-[0.08]"
        animate={{
          y: [0, -10, 0],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            animate={{
              y: i % 2 === 0 ? [0, -5, 0] : [0, 5, 0],
              rotate: i % 2 === 0 ? [0, 5, 0] : [0, -5, 0],
            }}
            transition={{
              duration: 3 + i * 0.5,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: i * 0.3,
            }}
          >
            <BirdSVG className={`w-4 h-4`} />
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );
}

// =============================================================================
// MOSQUE SILHOUETTE SVG
// =============================================================================

function MosqueSilhouette({ position }: { position: 'left' | 'right' }) {
  const isLeft = position === 'left';
  
  return (
    <svg
      viewBox="0 0 200 150"
      className={`absolute bottom-0 ${isLeft ? 'left-0' : 'right-0'} h-[40vh] max-h-[300px] w-auto opacity-[0.06]`}
      fill="currentColor"
      style={{ transform: isLeft ? 'scaleX(1)' : 'scaleX(-1)' }}
    >
      {/* Main dome */}
      <ellipse cx="100" cy="80" rx="60" ry="50" className="fill-current" />
      {/* Main body */}
      <rect x="40" y="80" width="120" height="70" className="fill-current" />
      {/* Minarets */}
      <rect x="20" y="40" width="15" height="110" className="fill-current" />
      <rect x="165" y="40" width="15" height="110" className="fill-current" />
      {/* Minaret tops */}
      <ellipse cx="27.5" cy="40" rx="7.5" ry="10" className="fill-current" />
      <ellipse cx="172.5" cy="40" rx="7.5" ry="10" className="fill-current" />
      {/* Golden dome (accent) */}
      <ellipse 
        cx="100" 
        cy="65" 
        rx="25" 
        ry="20" 
        className="golden-dome" 
        fill="var(--accent-gold)"
        opacity="0.15"
      />
    </svg>
  );
}

// =============================================================================
// MAIN PARALLAX BACKGROUND
// =============================================================================

export default function ParallaxBackground() {
  const prefersReducedMotion = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end start'],
  });

  // Smooth scroll progress for parallax
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  return (
    <div 
      ref={containerRef}
      className="background-wrapper"
      aria-hidden="true"
    >
      {/* Base gradient - sky effect */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'var(--gradient-sky)',
        }}
      />

      {/* Warm radial gradients for depth */}
      <div 
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 150% 80% at 50% 100%, var(--accent-gold-light) 0%, transparent 60%),
            radial-gradient(ellipse 80% 50% at 20% 80%, var(--accent-teal-light) 0%, transparent 50%),
            radial-gradient(ellipse 80% 50% at 80% 80%, var(--accent-teal-light) 0%, transparent 50%)
          `,
        }}
      />

      {/* Clouds layer - slowest parallax */}
      {!prefersReducedMotion && (
        <div className="bg-clouds">
          <Cloud
            className="w-[600px] h-[200px] top-[5%] -left-[10%]"
            scrollYProgress={smoothProgress}
            speed={0.2}
            opacity={0.3}
          />
          <Cloud
            className="w-[500px] h-[180px] top-[15%] -right-[5%]"
            scrollYProgress={smoothProgress}
            speed={0.15}
            opacity={0.25}
          />
          <Cloud
            className="w-[400px] h-[150px] top-[25%] left-[30%]"
            scrollYProgress={smoothProgress}
            speed={0.25}
            opacity={0.2}
          />
        </div>
      )}

      {/* Static clouds for reduced motion */}
      {prefersReducedMotion && (
        <div className="bg-clouds">
          <div 
            className="cloud w-[600px] h-[200px] top-[5%] -left-[10%]"
            style={{ opacity: 0.3 }}
          />
          <div 
            className="cloud w-[500px] h-[180px] top-[15%] -right-[5%]"
            style={{ opacity: 0.25 }}
          />
        </div>
      )}

      {/* Flying birds */}
      <FlyingBirds scrollYProgress={smoothProgress} />

      {/* Mosque silhouettes - medium parallax */}
      <MosqueSilhouette position="left" />
      <MosqueSilhouette position="right" />

      {/* Subtle geometric pattern overlay */}
      <div className="bg-pattern" />

      {/* Vignette effect for depth */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.03) 100%)',
        }}
      />
    </div>
  );
}

// =============================================================================
// SCROLL PROGRESS INDICATOR
// =============================================================================

export function ScrollIndicator() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });

  return (
    <motion.div
      className="fixed top-0 left-0 right-0 h-[3px] bg-[var(--accent-teal)] origin-left z-50"
      style={{ scaleX }}
    />
  );
}
