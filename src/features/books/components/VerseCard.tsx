'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { useReducedMotion } from '@/lib/hooks';
import { motion as motionTokens } from '@/lib/design-system/motion';

interface VerseCardProps {
  verse: {
    fa: string;
    en?: string;
    kr?: string;
    book?: string;
    page?: number;
  };
  language: 'fa' | 'en' | 'kr';
}

export default function VerseCard({ verse, language }: VerseCardProps) {
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

  // Generate link to book reader with page/highlight
  const getVerseLink = () => {
    if (!verse.book || !verse.page) return null;
    
    // Map book name to book ID
    const bookIdMap: Record<string, string> = {
      'Masnavi': 'masnavi',
      'Divan-e Shams': 'divan-e-shams',
      'Fihi Ma Fihi': 'fihi-ma-fihi',
    };
    
    const bookId = bookIdMap[verse.book];
    if (!bookId) return null;
    
    return `/books/${bookId}?page=${verse.page}&highlight=${encodeURIComponent(verse.fa.slice(0, 20))}`;
  };

  const verseLink = getVerseLink();

  return (
    <motion.div
      className="books-verse-card"
      variants={containerVariants}
      initial="initial"
      animate="animate"
    >
      {/* Persian Verse - RTL at top */}
      <motion.p
        className="books-verse-card-persian"
        lang="fa"
        dir="rtl"
        variants={childVariants}
      >
        {verse.fa}
      </motion.p>

      {/* English Translation */}
      {verse[language] && language !== 'fa' && (
        <motion.p
          className="books-verse-card-translation"
          variants={childVariants}
        >
          {verse[language]}
        </motion.p>
      )}

      {/* Individual verse action button */}
      {verseLink && (
        <motion.div
          className="books-verse-card-action"
          variants={childVariants}
        >
          <Link href={verseLink} className="books-verse-card-button">
            View Source
          </Link>
        </motion.div>
      )}
    </motion.div>
  );
}
