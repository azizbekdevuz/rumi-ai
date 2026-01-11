'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { useI18n } from '@/lib/i18n/i18n-context';
import { ChevronRightIcon } from '@/components/ui/icons';
import { useReducedMotion } from '@/lib/hooks/use-reduced-motion';
import { buttonHover } from '@/lib/design-system/motion';

// =============================================================================
// ANIMATED TEXT REVEAL
// =============================================================================

interface AnimatedTextProps {
  text: string;
  className?: string;
  lang?: string;
  dir?: 'ltr' | 'rtl';
  id?: string;
  as?: 'h1' | 'p' | 'span';
}

function AnimatedText({ 
  text, 
  className = '', 
  lang, 
  dir,
  id,
  as: Component = 'span' 
}: AnimatedTextProps) {
  const prefersReducedMotion = useReducedMotion();
  
  // For reduced motion, just show the text
  if (prefersReducedMotion) {
    return (
      <Component id={id} className={className} lang={lang} dir={dir}>
        {text}
      </Component>
    );
  }

  // Split text into words for staggered reveal
  const words = text.split(' ');

  const container = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.1,
      },
    },
  };

  const child = {
    hidden: { 
      opacity: 0, 
      y: 20,
      filter: 'blur(4px)',
    },
    visible: {
      opacity: 1,
      y: 0,
      filter: 'blur(0px)',
      transition: {
        type: 'spring' as const,
        stiffness: 300,
        damping: 24,
      },
    },
  };

  // Use motion.h1 or motion.p based on the component
  const MotionComponent = Component === 'h1' ? motion.h1 : Component === 'p' ? motion.p : motion.span;

  return (
    <MotionComponent
      id={id}
      className={className}
      lang={lang}
      dir={dir}
      variants={container}
      initial="hidden"
      animate="visible"
    >
      {words.map((word, index) => (
        <motion.span
          key={index}
          variants={child}
          className="inline-block"
          style={{ marginRight: '0.25em' }}
        >
          {word}
        </motion.span>
      ))}
    </MotionComponent>
  );
}

// =============================================================================
// HERO COMPONENT
// =============================================================================

export default function Hero() {
  const { t } = useI18n();
  const prefersReducedMotion = useReducedMotion();

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.1,
      },
    },
  };

  const translationVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: [0.16, 1, 0.3, 1] as const,
        delay: 0.5,
      },
    },
  };

  const ctaVariants = {
    hidden: { opacity: 0, y: 16, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.5,
        ease: [0.16, 1, 0.3, 1] as const,
        delay: 0.8,
      },
    },
  };

  return (
    <section className="hero" aria-labelledby="hero-title">
      <div className="hero-container">
        <motion.div 
          className="hero-content"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Persian Quote - animated word by word */}
          <AnimatedText
            id="hero-title"
            text={t.hero.quote}
            className="hero-quote"
            lang="fa"
            dir="rtl"
            as="h1"
          />
          
          {/* Translation - fade up after quote */}
          <motion.p 
            className="hero-translation"
            variants={translationVariants}
            initial="hidden"
            animate="visible"
          >
            {t.hero.quoteTranslation}
          </motion.p>
        </motion.div>
        
        {/* CTA Button - centered separately */}
        <motion.div
          className="flex justify-center w-full"
          variants={ctaVariants}
          initial="hidden"
          animate="visible"
        >
            <motion.div
              variants={buttonHover}
              initial="rest"
              whileHover="hover"
              whileTap="tap"
            >
              <Link 
                href="/chat" 
                className="hero-cta group"
              >
                <span className="relative z-10">{t.hero.cta}</span>
                <motion.span
                  className="relative z-10"
                  animate={{ x: [0, 4, 0] }}
                  transition={{ 
                    duration: 1.5, 
                    repeat: Infinity, 
                    ease: 'easeInOut',
                    repeatDelay: 0.5,
                  }}
                >
                  <ChevronRightIcon aria-hidden="true" />
                </motion.span>
                
                {/* Glow effect on hover */}
                <motion.div
                  className="absolute inset-0 rounded-full"
                  style={{
                    background: 'radial-gradient(circle at center, rgba(255,255,255,0.2) 0%, transparent 70%)',
                  }}
                  initial={{ opacity: 0 }}
                  whileHover={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                />
          </Link>
            </motion.div>
        </motion.div>
        </div>

      {/* Decorative floating elements */}
      {!prefersReducedMotion && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {/* Floating ornaments */}
          <motion.div
            className="absolute top-1/4 left-[10%] w-2 h-2 rounded-full bg-[var(--accent-gold)] opacity-30"
            animate={{
              y: [0, -20, 0],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
          <motion.div
            className="absolute top-1/3 right-[15%] w-3 h-3 rounded-full bg-[var(--accent-teal)] opacity-20"
            animate={{
              y: [0, -15, 0],
              opacity: [0.2, 0.4, 0.2],
            }}
            transition={{
              duration: 5,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: 1,
            }}
          />
          <motion.div
            className="absolute bottom-1/4 left-[20%] w-1.5 h-1.5 rounded-full bg-[var(--accent-gold)] opacity-40"
            animate={{
              y: [0, -25, 0],
              opacity: [0.4, 0.6, 0.4],
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: 2,
            }}
          />
      </div>
      )}
    </section>
  );
}
