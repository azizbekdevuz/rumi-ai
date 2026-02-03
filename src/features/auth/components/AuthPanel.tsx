'use client';

import { motion } from 'framer-motion';
import { useReducedMotion } from '@/lib/hooks';
import { motion as motionTokens } from '@/lib/design-system/motion';

interface AuthPanelProps {
  children: React.ReactNode;
}

export default function AuthPanel({ children }: AuthPanelProps) {
  const reducedMotion = useReducedMotion();

  const panelVariants = reducedMotion
    ? motionTokens.variants.reducedMotion
    : {
        initial: { opacity: 0, y: 20, scale: 0.98 },
        animate: {
          opacity: 1,
          y: 0,
          scale: 1,
          transition: {
            type: 'spring' as const,
            stiffness: 120,
            damping: 20,
            delay: 0.1,
          },
        },
      };

  return (
    <motion.div
      className="auth-panel"
      variants={panelVariants}
      initial="initial"
      animate="animate"
    >
      <div className="auth-panel-inner">
        {children}
      </div>
    </motion.div>
  );
}
