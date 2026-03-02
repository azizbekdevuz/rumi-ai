'use client';

import { useI18n } from '@/lib/i18n/i18n-context';
import { motion } from 'framer-motion';
import { motion as motionTokens } from '@/lib/design-system/motion';
import { useReducedMotion } from '@/lib/hooks';
import Link from 'next/link';
import { Shield, ChevronRight, Lock, Eye, Database, UserCheck, FileText, Globe } from 'lucide-react';
import { useState } from 'react';

const privacyIcons = [
  Lock, Eye, Database, UserCheck, FileText, Globe, Shield, Lock
];

export default function PrivacyPage() {
  const { t, dir } = useI18n();
  const reducedMotion = useReducedMotion();
  const [expandedCards, setExpandedCards] = useState<Set<number>>(new Set());

  const fadeUp = reducedMotion ? motionTokens.variants.reducedMotion : motionTokens.variants.fadeUp;
  const stagger = reducedMotion ? motionTokens.variants.reducedMotion : motionTokens.variants.staggerContainer;

  const content = t.privacy || {
    title: 'Privacy Policy',
    subtitle: 'Your privacy matters to us.',
    lastUpdated: 'Last updated: March 2026',
    sections: [],
  };

  const toggleCard = (index: number) => {
    setExpandedCards(prev => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  return (
    <main className="privacy-page" dir={dir}>
      {/* Hero */}
      <section className="privacy-hero">
        <motion.div
          className="privacy-hero-content"
          initial="initial"
          animate="animate"
          variants={stagger}
        >
          <motion.div className="privacy-hero-icon-wrap" variants={fadeUp}>
            <Shield size={40} strokeWidth={1.5} />
          </motion.div>
          <motion.h1 className="privacy-hero-title" variants={fadeUp}>
            {content.title}
          </motion.h1>
          <motion.p className="privacy-hero-subtitle" variants={fadeUp}>
            {content.subtitle}
          </motion.p>
          <motion.span className="privacy-hero-date" variants={fadeUp}>
            {content.lastUpdated}
          </motion.span>
        </motion.div>
      </section>

      {/* Sections */}
      <section className="privacy-body">
        <div className="privacy-container">
          {content.sections.map((section, index) => {
            const Icon = privacyIcons[index % privacyIcons.length];
            const isExpanded = expandedCards.has(index);
            
            return (
              <motion.article
                key={index}
                className={`privacy-section-card ${isExpanded ? 'privacy-card-expanded' : ''}`}
                initial={reducedMotion ? {} : { opacity: 0, y: 20 }}
                whileInView={reducedMotion ? {} : { opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ delay: index * 0.05, duration: 0.5 }}
              >
                <div className="privacy-card-header" onClick={() => toggleCard(index)}>
                  <div className="privacy-card-icon-wrapper">
                    <Icon className="privacy-card-icon" size={24} />
                  </div>
                  <div className="privacy-card-header-content">
                    <h2 className="privacy-section-heading">{section.heading}</h2>
                  </div>
                  <ChevronRight className={`privacy-card-arrow ${isExpanded ? 'expanded' : ''}`} size={20} />
                </div>
                <div className={`privacy-section-content ${isExpanded ? 'expanded' : ''}`}>
                  <p className="privacy-section-text">{section.content}</p>
                </div>
              </motion.article>
            );
          })}
        </div>
      </section>

      {/* CTA */}
      <section className="privacy-cta">
        <motion.div
          className="privacy-cta-inner"
          initial={reducedMotion ? {} : { opacity: 0, y: 16 }}
          whileInView={reducedMotion ? {} : { opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <p className="privacy-cta-text">
            {t.privacy?.ctaText || 'Have questions about your privacy?'}
          </p>
          <Link href="/contact" className="privacy-cta-link">
            {t.about?.contactUs || 'Contact Us'}
            <ChevronRight size={16} />
          </Link>
        </motion.div>
      </section>
    </main>
  );
}
