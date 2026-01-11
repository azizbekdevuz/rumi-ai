'use client';

import { motion } from 'framer-motion';
import { useReducedMotion } from '@/lib/hooks/use-reduced-motion';

interface SectionDividerProps {
  className?: string;
}

export default function SectionDivider({ className = '' }: SectionDividerProps) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _prefersReducedMotion = useReducedMotion();

  const lineVariants = {
    hidden: { scaleX: 0 },
    visible: {
      scaleX: 1,
      transition: {
        duration: 0.8,
        ease: [0.16, 1, 0.3, 1] as const,
      },
    },
  };

  const ornamentVariants = {
    hidden: { scale: 0, rotate: -180 },
    visible: {
      scale: 1,
      rotate: 0,
      transition: {
        type: 'spring' as const,
        stiffness: 300,
        damping: 20,
        delay: 0.3,
      },
    },
  };

  return (
    <motion.div
      className={`section-divider ${className}`}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.5 }}
    >
      <motion.div 
        className="divider-line divider-line-left"
        variants={lineVariants}
      />
      <motion.svg
        className="divider-ornament"
        variants={ornamentVariants}
        width="40"
        height="40"
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {/* Ornamental pattern */}
        <path
          d="M20 8 L20 32 M8 20 L32 20 M14 14 L26 26 M26 14 L14 26"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <circle cx="20" cy="20" r="6" fill="none" stroke="currentColor" strokeWidth="2" />
        <circle cx="20" cy="20" r="3" fill="currentColor" />
      </motion.svg>
      <motion.div 
        className="divider-line divider-line-right"
        variants={lineVariants}
      />
    </motion.div>
  );
}
