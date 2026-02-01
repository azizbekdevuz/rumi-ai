'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { useReducedMotion } from '@/lib/hooks';
import { motion as motionTokens } from '@/lib/design-system/motion';
import { Book } from '@/lib/data/books';

interface BookCardProps {
  book: Book;
  language: 'fa' | 'en' | 'kr';
}

export default function BookCard({ book, language }: BookCardProps) {
  const reducedMotion = useReducedMotion();

  const getLocalizedTitle = () => {
    if (language === 'fa') return book.titleFa;
    if (language === 'kr') return book.titleKr;
    return book.title;
  };

  const getLocalizedDescription = () => {
    if (language === 'fa') return book.descriptionFa;
    if (language === 'kr') return book.descriptionKr;
    return book.description;
  };

  const cardVariants = reducedMotion
    ? undefined
    : motionTokens.variants.cardHover;

  // Determine volumes/languages metadata
  const volumes = book.pages > 500 ? '6 volumes' : book.pages > 300 ? '3 volumes' : '1 volume';
  const languages = 'Persian, English, Korean';

  return (
    <motion.div
      className="books-book-card"
      variants={cardVariants}
      initial="rest"
      whileHover={reducedMotion ? {} : 'hover'}
      whileTap={reducedMotion ? {} : 'tap'}
    >
      {/* Cover Image Area */}
      <div className="books-book-cover">
        <Image
          src="/img/books/book1.webp"
          alt={getLocalizedTitle()}
          width={200}
          height={280}
          className="books-book-image"
          priority={false}
        />
      </div>

      {/* Content */}
      <div className="books-book-content">
        <h3 className="books-book-title">{getLocalizedTitle()}</h3>
        <p className="books-book-description">{getLocalizedDescription()}</p>
        <div className="books-book-meta">
          <span>{volumes}</span>
          <span className="books-book-meta-separator">•</span>
          <span>{languages}</span>
        </div>
        <Link href={`/books/${book.id}`} className="books-book-read-button">
          Read
        </Link>
      </div>
    </motion.div>
  );
}
