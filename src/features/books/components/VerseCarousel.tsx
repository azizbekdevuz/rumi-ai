'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useReducedMotion } from '@/lib/hooks';
import { motion as motionTokens } from '@/lib/design-system/motion';
import VerseCard from './VerseCard';
import { Verse } from '@/lib/data/verses';

interface VerseCarouselProps {
  verses: Verse[];
  language: 'fa' | 'en' | 'kr';
}

export default function VerseCarousel({ verses, language }: VerseCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [cardsPerView, setCardsPerView] = useState(3);
  const reducedMotion = useReducedMotion();

  // Responsive cards per view
  useEffect(() => {
    const updateCardsPerView = () => {
      if (typeof window !== 'undefined') {
        if (window.innerWidth < 768) {
          setCardsPerView(1);
        } else if (window.innerWidth < 1024) {
          setCardsPerView(2);
        } else {
          setCardsPerView(3);
        }
      }
    };

    updateCardsPerView();
    window.addEventListener('resize', updateCardsPerView);
    return () => window.removeEventListener('resize', updateCardsPerView);
  }, []);

  const maxIndex = Math.max(0, verses.length - cardsPerView);

  const goToPrevious = () => {
    setCurrentIndex((prev) => Math.max(0, prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => Math.min(maxIndex, prev + 1));
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(Math.max(0, Math.min(maxIndex, index)));
  };

  const visibleVerses = verses.slice(currentIndex, currentIndex + cardsPerView);

  const carouselVariants = reducedMotion
    ? motionTokens.variants.reducedMotion
    : {
        initial: { opacity: 0, x: 20 },
        animate: {
          opacity: 1,
          x: 0,
          transition: {
            type: 'spring' as const,
            stiffness: 300,
            damping: 30,
          },
        },
      };

  return (
    <section className="books-verse-carousel-section" aria-label="Timeless Poetry of Rumi">
      {/* Section Title */}
      <div className="books-verse-section-header">
        <h2 className="books-verse-section-title">Timeless Poetry of Rumi</h2>
      </div>

      {/* Carousel Container */}
      <div className="books-verse-carousel-container">
        {/* Left Arrow */}
        <button
          className="books-verse-carousel-arrow books-verse-carousel-arrow-left"
          onClick={goToPrevious}
          disabled={currentIndex === 0}
          aria-label="Previous verses"
        >
          <ChevronLeft aria-hidden="true" />
        </button>

        {/* Cards */}
        <div className="books-verse-carousel-track">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              className="books-verse-carousel-slide"
              variants={carouselVariants}
              initial="initial"
              animate="animate"
            >
              {visibleVerses.map((verse, index) => (
                <div key={`${currentIndex}-${index}`} className="books-verse-carousel-card-wrapper">
                  <VerseCard 
                    verse={{
                      fa: verse.fa,
                      en: verse.en,
                      kr: verse.kr,
                      book: verse.book,
                      page: verse.page,
                    }} 
                    language={language} 
                  />
                </div>
              ))}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Right Arrow */}
        <button
          className="books-verse-carousel-arrow books-verse-carousel-arrow-right"
          onClick={goToNext}
          disabled={currentIndex >= maxIndex}
          aria-label="Next verses"
        >
          <ChevronRight aria-hidden="true" />
        </button>
      </div>

      {/* Dot Pagination */}
2      {maxIndex > 0 && (
        <div className="books-verse-carousel-dots" role="tablist" aria-label="Verse carousel pagination">
          {Array.from({ length: maxIndex + 1 }).map((_, index) => (
            <button
              key={index}
              role="tab"
              aria-selected={currentIndex === index}
              aria-label={`Go to verse set ${index + 1}`}
              className={`books-verse-carousel-dot ${currentIndex === index ? 'active' : ''}`}
              onClick={() => goToSlide(index)}
            />
          ))}
        </div>
      )}

    </section>
  );
}
