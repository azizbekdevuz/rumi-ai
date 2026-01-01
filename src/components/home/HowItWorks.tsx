'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { useI18n } from '@/lib/i18n/i18n-context';
import { WhirlingDervish, ChatIcon, BooksIcon, InspirationIcon } from '@/components/ui/icons';
import { useReducedMotion } from '@/lib/hooks/use-reduced-motion';
import { buttonHover } from '@/lib/design-system/motion';

// =============================================================================
// STEP DATA
// =============================================================================

const steps = [
  { number: 1, key: 'step1' as const },
  { number: 2, key: 'step2' as const },
  { number: 3, key: 'step3' as const },
  { number: 4, key: 'step4' as const },
];

// =============================================================================
// ANIMATED STEP COMPONENT
// =============================================================================

interface StepProps {
  number: number;
  text: string;
  index: number;
}

function AnimatedStep({ number, text, index }: StepProps) {
  const prefersReducedMotion = useReducedMotion();

  const stepVariants = {
    hidden: { 
      opacity: 0, 
      x: 30,
    },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 24,
        delay: index * 0.15,
      },
    },
  };

  const numberVariants = {
    hidden: { scale: 0, rotate: -180 },
    visible: {
      scale: 1,
      rotate: 0,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 20,
        delay: index * 0.15 + 0.1,
      },
    },
  };

  return (
    <motion.div 
      className="step"
      variants={stepVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.5 }}
    >
      <motion.div 
        className="step-number" 
        aria-hidden="true"
        variants={numberVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.5 }}
        whileHover={prefersReducedMotion ? undefined : { scale: 1.1, rotate: 5 }}
        transition={{ type: 'spring', stiffness: 400, damping: 15 }}
      >
        {number}
      </motion.div>
      <p className="step-text">{text}</p>
    </motion.div>
  );
}

// =============================================================================
// ANIMATED ILLUSTRATION
// =============================================================================

function AnimatedIllustration() {
  const prefersReducedMotion = useReducedMotion();

  const containerVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.6,
        ease: [0.16, 1, 0.3, 1],
        staggerChildren: 0.2,
        delayChildren: 0.3,
      },
    },
  };

  const bubbleVariants = {
    hidden: { opacity: 0, scale: 0 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 15,
      },
    },
  };

  const floatAnimation = prefersReducedMotion ? {} : {
    y: [0, -8, 0],
    transition: {
      duration: 3,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  };

  return (
    <motion.div 
      className="how-it-works-illustration"
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.3 }}
    >
      <motion.div 
        className="illustration-box"
        whileHover={prefersReducedMotion ? undefined : { scale: 1.02 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      >
        {/* Whirling Dervish with subtle rotation */}
        <motion.div
          animate={prefersReducedMotion ? undefined : {
            rotate: [0, 2, 0, -2, 0],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          <WhirlingDervish className="illustration-person" aria-hidden="true" />
        </motion.div>
        
        {/* Floating bubbles with stagger */}
        <motion.div 
          className="illustration-bubble bubble-1"
          variants={bubbleVariants}
          animate={floatAnimation}
        >
          <ChatIcon aria-hidden="true" />
        </motion.div>
        
        <motion.div 
          className="illustration-bubble bubble-2"
          variants={bubbleVariants}
          animate={{
            ...floatAnimation,
            transition: { ...floatAnimation.transition, delay: 1 },
          }}
        >
          <BooksIcon aria-hidden="true" />
        </motion.div>
        
        <motion.div 
          className="illustration-bubble bubble-3"
          variants={bubbleVariants}
          animate={{
            ...floatAnimation,
            transition: { ...floatAnimation.transition, delay: 2 },
          }}
        >
          <InspirationIcon aria-hidden="true" />
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

// =============================================================================
// GOLD CTA BUTTON
// =============================================================================

function GoldCTA({ text, href }: { text: string; href: string }) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.5 }}
      transition={{
        duration: 0.5,
        ease: [0.16, 1, 0.3, 1],
        delay: 0.4,
      }}
    >
      <motion.div
        variants={buttonHover}
        initial="rest"
        whileHover="hover"
        whileTap="tap"
      >
        <Link 
          href={href} 
          className="journey-cta relative overflow-hidden group"
        >
          <span className="relative z-10">{text}</span>
          
          {/* Shimmer effect */}
          {!prefersReducedMotion && (
            <motion.div
              className="absolute inset-0 z-0"
              style={{
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
              }}
              initial={{ x: '-100%' }}
              animate={{ x: '100%' }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatDelay: 3,
                ease: 'easeInOut',
              }}
            />
          )}
          
          {/* Glow effect */}
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
  );
}

// =============================================================================
// SECTION TITLE
// =============================================================================

function AnimatedTitle({ title }: { title: string }) {
  const titleVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: [0.16, 1, 0.3, 1],
      },
    },
  };

  const lineVariants = {
    hidden: { scaleX: 0 },
    visible: {
      scaleX: 1,
      transition: {
        duration: 0.8,
        ease: [0.16, 1, 0.3, 1],
        delay: 0.3,
      },
    },
  };

  return (
    <motion.h2 
      id="how-it-works-title" 
      className="how-it-works-title"
      variants={titleVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.5 }}
    >
      <motion.span
        className="inline-block h-[1px] w-[60px]"
        style={{ background: 'linear-gradient(90deg, transparent, var(--accent-gold), transparent)' }}
        variants={lineVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      />
      {title}
      <motion.span
        className="inline-block h-[1px] w-[60px]"
        style={{ background: 'linear-gradient(90deg, transparent, var(--accent-gold), transparent)' }}
        variants={lineVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      />
    </motion.h2>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function HowItWorks() {
  const { t } = useI18n();

  return (
    <section className="how-it-works" aria-labelledby="how-it-works-title">
      <div className="how-it-works-container">
        {/* Animated Title */}
        <AnimatedTitle title={t.howItWorks.title} />
        
        <div className="how-it-works-content">
          {/* Animated Illustration */}
          <AnimatedIllustration />

          {/* Animated Steps */}
          <div className="how-it-works-steps">
            {steps.map((step, index) => (
              <AnimatedStep
                key={step.number}
                number={step.number}
                text={t.howItWorks[step.key]}
                index={index}
              />
            ))}
          </div>
        </div>

        {/* Gold CTA */}
        <div className="how-it-works-cta">
          <GoldCTA text={t.howItWorks.cta} href="/chat" />
        </div>
      </div>
    </section>
  );
}
