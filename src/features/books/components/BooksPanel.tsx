'use client';

import { motion } from 'framer-motion';
import { useReducedMotion } from '@/lib/hooks';
import { motion as motionTokens } from '@/lib/design-system/motion';

interface BooksPanelProps {
  children: React.ReactNode;
}

export default function BooksPanel({ children }: BooksPanelProps) {
  const reducedMotion = useReducedMotion();

  const panelVariants = reducedMotion
    ? motionTokens.variants.reducedMotion
    : {
        initial: { opacity: 0, y: 30, scale: 0.98 },
        animate: {
          opacity: 1,
          y: 0,
          scale: 1,
          transition: {
            duration: 0.6,
            ease: [0.45, 0, 0.15, 1] as const,
            delay: 0.3,
          },
        },
      };

  return (
    <motion.div
      className="books-panel"
      variants={panelVariants}
      initial="initial"
      animate="animate"
    >
      {children}
    </motion.div>
  );
}
