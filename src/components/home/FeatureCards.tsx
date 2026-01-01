'use client';

import { useRef, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { useI18n } from '@/lib/i18n/i18n-context';
import Link from 'next/link';
import { ChatIcon, BooksIcon, LanguageIcon, InspirationIcon } from '@/components/ui/icons';
import { useReducedMotion } from '@/lib/hooks/use-reduced-motion';
import { staggerContainer, staggerChild } from '@/lib/design-system/motion';

// =============================================================================
// FEATURE DATA
// =============================================================================

const features = [
  {
    key: 'chat' as const,
    Icon: ChatIcon,
    href: '/chat',
    accentColor: 'var(--accent-teal)',
  },
  {
    key: 'books' as const,
    Icon: BooksIcon,
    href: '/books',
    accentColor: 'var(--accent-gold)',
  },
  {
    key: 'multilingual' as const,
    Icon: LanguageIcon,
    href: '/about',
    accentColor: 'var(--accent-teal)',
  },
  {
    key: 'daily' as const,
    Icon: InspirationIcon,
    href: '/chat',
    accentColor: 'var(--accent-gold)',
  },
];

// =============================================================================
// 3D TILT CARD COMPONENT
// =============================================================================

interface FeatureCardProps {
  feature: typeof features[0];
  title: string;
  description: string;
  index: number;
}

function FeatureCard({ feature, title, description, index }: FeatureCardProps) {
  const { Icon, href, accentColor } = feature;
  const prefersReducedMotion = useReducedMotion();
  const cardRef = useRef<HTMLAnchorElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  // Motion values for 3D tilt
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Spring configs for smooth movement
  const springConfig = { stiffness: 300, damping: 30 };
  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [8, -8]), springConfig);
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-8, 8]), springConfig);

  // Handle mouse movement for 3D tilt
  const handleMouseMove = (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (!cardRef.current || prefersReducedMotion) return;

    const rect = cardRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const mouseX = event.clientX - centerX;
    const mouseY = event.clientY - centerY;
    
    const normalizedX = mouseX / (rect.width / 2);
    const normalizedY = mouseY / (rect.height / 2);
    
    x.set(normalizedX);
    y.set(normalizedY);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    x.set(0);
    y.set(0);
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  // Card animation variants
  const cardVariants = {
    hidden: { 
      opacity: 0, 
      y: 40,
      scale: 0.95,
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: 'spring' as const,
        stiffness: 300,
        damping: 24,
        delay: index * 0.1,
      },
    },
  };

  // Icon animation
  const iconVariants = {
    rest: { scale: 1, rotate: 0 },
    hover: { 
      scale: 1.1, 
      rotate: 5,
      transition: { type: 'spring' as const, stiffness: 400, damping: 15 },
    },
  };

  return (
    <motion.div
      variants={cardVariants}
      style={{
        perspective: '1000px',
      }}
    >
      <motion.a
        ref={cardRef}
        href={href}
        className="feature-card block"
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{
          rotateX: prefersReducedMotion ? 0 : rotateX,
          rotateY: prefersReducedMotion ? 0 : rotateY,
          transformStyle: 'preserve-3d',
          boxShadow: isHovered 
            ? `0 20px 40px rgba(45, 55, 72, 0.15), 0 8px 16px ${accentColor}20`
            : '0 4px 20px rgba(45, 55, 72, 0.08)',
        }}
        animate={{
          scale: isHovered && !prefersReducedMotion ? 1.02 : 1,
          y: isHovered && !prefersReducedMotion ? -8 : 0,
        }}
        transition={{
          scale: { type: 'spring', stiffness: 400, damping: 30 },
          y: { type: 'spring', stiffness: 400, damping: 30 },
        }}
        initial="rest"
        whileHover="hover"
      >
        {/* Icon with animation */}
        <motion.div 
          className="feature-icon" 
          aria-hidden="true"
          variants={iconVariants}
          style={{ color: accentColor }}
        >
          <Icon />
        </motion.div>

        {/* Title */}
        <h3 className="feature-title">{title}</h3>

        {/* Description */}
        <p className="feature-description">{description}</p>

        {/* Hover glow effect */}
        <motion.div
          className="absolute inset-0 rounded-[var(--radius-lg)] pointer-events-none"
          style={{
            background: `radial-gradient(600px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), ${accentColor}10, transparent 40%)`,
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: isHovered ? 1 : 0 }}
          transition={{ duration: 0.3 }}
        />

        {/* Border glow on hover */}
        <motion.div
          className="absolute inset-0 rounded-[var(--radius-lg)] pointer-events-none"
          style={{
            border: `1px solid ${accentColor}`,
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: isHovered ? 0.3 : 0 }}
          transition={{ duration: 0.3 }}
        />
      </motion.a>
    </motion.div>
  );
}

// =============================================================================
// FEATURE CARDS SECTION
// =============================================================================

export default function FeatureCards() {
  const { t } = useI18n();
  const prefersReducedMotion = useReducedMotion();

  return (
    <section className="features" aria-labelledby="features-title">
      <h2 id="features-title" className="sr-only">Features</h2>
      
      <motion.div 
        className="features-container"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        variants={{
          hidden: {},
          visible: {
            transition: {
              staggerChildren: prefersReducedMotion ? 0 : 0.1,
              delayChildren: prefersReducedMotion ? 0 : 0.2,
            },
          },
        }}
      >
        {features.map((feature, index) => (
          <FeatureCard
            key={feature.key}
            feature={feature}
            title={t.features[feature.key].title}
            description={t.features[feature.key].description}
            index={index}
          />
        ))}
      </motion.div>
    </section>
  );
}
