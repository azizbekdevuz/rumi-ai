'use client';

import { useI18n } from '@/lib/i18n/i18n-context';
import { motion } from 'framer-motion';
import { motion as motionTokens } from '@/lib/design-system/motion';
import { useReducedMotion } from '@/lib/hooks';
import AboutPageShell from '@/features/about/components/AboutPageShell';
import { SectionDivider } from '@/components/ui';
import Image from 'next/image';
import Link from 'next/link';

export default function AboutPage() {
  const { t, dir } = useI18n();
  const direction = dir;
  const reducedMotion = useReducedMotion();

  const fadeUpVariants = reducedMotion ? motionTokens.variants.reducedMotion : motionTokens.variants.fadeUp;
  const staggerVariants = reducedMotion ? motionTokens.variants.reducedMotion : motionTokens.variants.staggerContainer;

  const aboutContent = t.about || {
    heroTitle: 'Rumi AI Agent',
    heroSubtitle: 'Bridging timeless wisdom with modern technology',
    missionTitle: 'Our Mission',
    missionText: 'Rumi AI exists to make the timeless wisdom of Persian poetry accessible and relevant to modern seekers.',
    featureMissionTitle: 'Our Mission',
    featureMissionText: 'Making ancient wisdom accessible and relevant for modern life through AI-powered guidance.',
    featureMultilingualTitle: 'Multilingual Support',
    featureMultilingualText: 'Experience Rumi\'s wisdom in your native language with full support for Persian, English, and Korean.',
    featureCitationTitle: 'Citation-Based Guidance',
    featureCitationText: 'Every response is grounded in authentic sources, ensuring accuracy and respect for the original teachings.',
    privacyPolicy: 'Privacy Policy',
    contactUs: 'Contact Us',
  };

  const features = [
    {
      icon: '/img/about/our-mission-about.webp',
      title: aboutContent.featureMissionTitle,
      text: aboutContent.featureMissionText,
    },
    {
      icon: '/img/about/multilingual-about.webp',
      title: aboutContent.featureMultilingualTitle,
      text: aboutContent.featureMultilingualText,
    },
    {
      icon: '/img/about/citation-about.webp',
      title: aboutContent.featureCitationTitle,
      text: aboutContent.featureCitationText,
    },
  ];

  return (
    <AboutPageShell>
      <main className="about-page" dir={direction}>
        {/* Hero Section */}
        <section className="about-hero-section">
          <motion.div 
            className="about-hero-content"
            initial="initial"
            animate="animate"
            variants={staggerVariants}
          >
            <motion.h1 
              className="about-hero-title"
              variants={fadeUpVariants}
              transition={{ delay: 0.1 }}
            >
              About
            </motion.h1>
            <motion.h2 
              className="about-hero-subtitle-main"
              variants={fadeUpVariants}
              transition={{ delay: 0.2 }}
            >
              {aboutContent.heroTitle}
            </motion.h2>
            <motion.p 
              className="about-hero-subtitle"
              variants={fadeUpVariants}
              transition={{ delay: 0.3 }}
            >
              {aboutContent.heroSubtitle}
            </motion.p>
            
            {/* Decorative divider ornament */}
            <motion.div
              className="about-hero-divider"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.5 }}
            >
              <SectionDivider />
            </motion.div>
          </motion.div>

        </section>

        {/* Mid-hero illustration band - positioned between hero and mission */}
        <section className="about-illustrations-band">
          <div className="about-hero-illustrations">
            <div className="about-illustration-wrapper about-illustration-wrapper-left">
              <motion.div
                className="about-illustration about-illustration-left"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5, duration: 0.6 }}
              >
                <Image
                  src="/img/about/caligraphy-about.webp"
                  alt=""
                  width={450}
                  height={338}
                  className="about-illustration-image"
                  aria-hidden="true"
                  unoptimized
                />
              </motion.div>
            </div>
            <div className="about-illustration-wrapper about-illustration-wrapper-right">
              <motion.div
                className="about-illustration about-illustration-right"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6, duration: 0.6 }}
              >
                <Image
                  src="/img/about/rumi-about.webp"
                  alt=""
                  width={650}
                  height={488}
                  className="about-illustration-image"
                  aria-hidden="true"
                  unoptimized
                />
              </motion.div>
            </div>
          </div>
        </section>

        {/* Our Mission Section */}
        <motion.section 
          className="about-mission-section"
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, amount: 0.3 }}
          variants={staggerVariants}
        >
          <div className="about-container">
            <motion.h2 
              className="about-mission-title"
              variants={fadeUpVariants}
            >
              {aboutContent.missionTitle}
            </motion.h2>
            <motion.p 
              className="about-mission-text"
              variants={fadeUpVariants}
              transition={{ delay: 0.1 }}
            >
              {aboutContent.missionText}
            </motion.p>
          </div>
        </motion.section>

        {/* Feature Cards Section */}
        <motion.section 
          className="about-features-section"
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, amount: 0.2 }}
          variants={staggerVariants}
        >
          <div className="about-container">
            <div className="about-features-grid">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  className="about-feature-card"
                  variants={fadeUpVariants}
                  transition={{ delay: index * 0.1 }}
                  whileHover={reducedMotion ? {} : { 
                    y: -8, 
                    boxShadow: 'var(--shadow-lg)',
                    transition: { type: 'spring' as const, stiffness: 300, damping: 20 }
                  }}
                >
                  <div className="about-feature-icon-wrapper">
                    <Image
                      src={feature.icon}
                      alt=""
                      width={120}
                      height={120}
                      className="about-feature-icon"
                    />
                  </div>
                  <h3 className="about-feature-title">{feature.title}</h3>
                  <p className="about-feature-text">{feature.text}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.section>

        {/* Footer Links */}
        <motion.section 
          className="about-footer-links"
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, amount: 0.3 }}
          variants={fadeUpVariants}
        >
          <div className="about-container">
            <div className="about-footer-links-content">
              <Link href="/privacy" className="about-footer-link">
                {aboutContent.privacyPolicy}
              </Link>
              <span className="about-footer-separator">|</span>
              <Link href="/contact" className="about-footer-link">
                {aboutContent.contactUs}
              </Link>
            </div>
          </div>
        </motion.section>
      </main>
    </AboutPageShell>
  );
}
