'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { motion as motionTokens } from '@/lib/design-system/motion';
import { useReducedMotion } from '@/lib/hooks';

export default function Template({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const reducedMotion = useReducedMotion();

  const pageVariants = reducedMotion
    ? motionTokens.variants.reducedMotion
    : motionTokens.variants.pageTransition;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        initial="initial"
        animate="animate"
        exit="exit"
        variants={pageVariants}
        className="page-transition-wrapper"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
