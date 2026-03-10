'use client';

import { motion } from 'framer-motion';
import { useReducedMotion } from '@/lib/hooks';
import { Citation } from '@/types/chat';
import { BooksIcon } from '@/components/ui/icons';

interface CitationChipProps {
  citation: Citation;
  onClick?: () => void;
  variant?: 'default' | 'inline';
}

export default function CitationChip({ citation, onClick, variant = 'default' }: CitationChipProps) {
  const reducedMotion = useReducedMotion();

  const formatCitation = () => {
    return `${citation.book} : Page ${citation.page ?? 'N/A'}`;
  };

  const chipVariants = reducedMotion
    ? undefined
    : {
        hover: { scale: 1.02, y: -2 },
        tap: { scale: 0.98 },
      };

  const Component = onClick ? motion.button : motion.div;

  return (
    <Component
      className={`citation-chip ${variant === 'inline' ? 'citation-chip-inline' : ''}`}
      onClick={onClick}
      variants={chipVariants}
      whileHover={reducedMotion || !onClick ? {} : 'hover'}
      whileTap={reducedMotion || !onClick ? {} : 'tap'}
      aria-label={`Citation from ${citation.book}, page ${citation.page ?? 'N/A'}`}
    >
      <BooksIcon style={{ width: 14, height: 14 }} aria-hidden="true" />
      <span>{formatCitation()}</span>
    </Component>
  );
}
