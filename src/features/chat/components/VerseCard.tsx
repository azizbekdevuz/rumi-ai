'use client';

import { motion } from 'framer-motion';
import { useReducedMotion } from '@/lib/hooks';
import { motion as motionTokens } from '@/lib/design-system/motion';
import CitationChip from './CitationChip';
import { Citation } from '@/types/chat';

interface VerseCardProps {
  verse: {
    fa: string;
    en?: string;
    kr?: string;
  };
  citation?: Citation;
  language: 'fa' | 'en' | 'kr';
}

export default function VerseCard({ verse, citation, language }: VerseCardProps) {
  const reducedMotion = useReducedMotion();

  const containerVariants = reducedMotion
    ? motionTokens.variants.reducedMotion
    : motionTokens.variants.staggerContainer;

  const childVariants = reducedMotion
    ? motionTokens.variants.reducedMotion
    : {
        initial: { opacity: 0, y: 12 },
        animate: {
          opacity: 1,
          y: 0,
          transition: {
            type: 'spring' as const,
            stiffness: 300,
            damping: 25,
          },
        },
      };

  return (
    <motion.div
      className="verse-card"
      variants={containerVariants}
      initial="initial"
      animate="animate"
    >
      {/* Persian Verse - Large, calligraphic feel */}
      <motion.p
        className="verse-card-persian"
        lang="fa"
        dir="rtl"
        variants={childVariants}
      >
        {verse.fa}
      </motion.p>

      {/* English Translation */}
      {verse[language] && language !== 'fa' && (
        <motion.p
          className="verse-card-translation"
          variants={childVariants}
        >
          {verse[language]}
        </motion.p>
      )}

      {/* Citation Chip */}
      {citation && (
        <motion.div
          className="verse-card-citation"
          variants={childVariants}
        >
          <CitationChip citation={citation} />
        </motion.div>
      )}
    </motion.div>
  );
}
