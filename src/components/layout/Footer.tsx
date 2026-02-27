'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { useI18n } from '@/lib/i18n/i18n-context';
import { useTheme } from '@/lib/theme/theme-context';
import { RumiLogo } from '@/components/ui/icons';
import { useReducedMotion } from '@/lib/hooks/use-reduced-motion';
import type { Language } from '@/lib/i18n/translations';

// =============================================================================
// FOOTER LINK
// =============================================================================

interface FooterLinkProps {
  href: string;
  children: React.ReactNode;
}

function FooterLink({ href, children }: FooterLinkProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      whileHover={prefersReducedMotion ? undefined : { x: 4 }}
      transition={{ type: 'spring' as const, stiffness: 400, damping: 20 }}
    >
      <Link href={href} className="footer-link">
        {children}
      </Link>
    </motion.div>
  );
}

// =============================================================================
// TOGGLE BUTTON
// =============================================================================

interface ToggleBtnProps {
  label: string;
  isActive: boolean;
  onClick: () => void;
  className: string;
}

function ToggleBtn({ label, isActive, onClick, className }: ToggleBtnProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.button
      onClick={onClick}
      className={`${className} ${isActive ? 'active' : ''}`}
      aria-pressed={isActive}
      whileHover={prefersReducedMotion ? undefined : { scale: 1.05 }}
      whileTap={prefersReducedMotion ? undefined : { scale: 0.95 }}
      transition={{ type: 'spring' as const, stiffness: 400, damping: 20 }}
    >
      {label}
    </motion.button>
  );
}

// =============================================================================
// MAIN FOOTER
// =============================================================================

export default function Footer() {
  const { language, setLanguage, t } = useI18n();
  const { theme, setTheme } = useTheme();
  const prefersReducedMotion = useReducedMotion();

  const languages: { key: Language; label: string }[] = [
    { key: 'fa', label: 'FA' },
    { key: 'en', label: 'EN' },
    { key: 'kr', label: 'KR' },
  ];

  const themes = [
    { key: 'light' as const, label: t.footer.light },
    { key: 'dark' as const, label: t.footer.dark },
  ];

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: prefersReducedMotion ? 0 : 0.1,
        delayChildren: prefersReducedMotion ? 0 : 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: [0.16, 1, 0.3, 1] as const,
      },
    },
  };

  return (
    <footer className="footer" role="contentinfo">
      <motion.div
        className="footer-container"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
      >
        {/* Logo & Tagline */}
        <motion.div className="footer-column" variants={itemVariants}>
          <Link href="/" className="footer-brand">
            <motion.div
              whileHover={prefersReducedMotion ? undefined : { rotate: 10, scale: 1.1 }}
              transition={{ type: 'spring' as const, stiffness: 400, damping: 15 }}
            >
              <RumiLogo className="w-8 h-8" />
            </motion.div>
            <span className="footer-brand-name">Rumi AI Agent</span>
          </Link>
          <p className="footer-tagline">{t.footer.tagline}</p>
        </motion.div>

        {/* Quick Links */}
        <motion.div className="footer-column" variants={itemVariants}>
          <h3 className="footer-heading">{t.footer.quickLinks}</h3>
          <nav className="footer-links" aria-label="Footer navigation">
            <FooterLink href="/">{t.nav.home}</FooterLink>
            <FooterLink href="/chat">{t.nav.chat}</FooterLink>
            <FooterLink href="/books">{t.nav.books}</FooterLink>
            <FooterLink href="/about">{t.nav.about}</FooterLink>
          </nav>
        </motion.div>

        {/* Language & Theme */}
        <motion.div className="footer-column" variants={itemVariants}>
          {/* Language Switcher */}
          <div className="footer-setting-row">
            <span className="footer-setting-label">{t.footer.language}:</span>
            <div className="footer-language" role="group" aria-label={t.footer.language}>
              {languages.map((lang) => (
                <ToggleBtn
                  key={lang.key}
                  label={lang.label}
                  isActive={language === lang.key}
                  onClick={() => setLanguage(lang.key)}
                  className="footer-lang-btn"
                />
              ))}
            </div>
          </div>

          {/* Theme Switcher */}
          <div className="footer-setting-row">
            <span className="footer-setting-label">{t.footer.theme}:</span>
            <div className="footer-theme" role="group" aria-label={t.footer.theme}>
              {themes.map((th) => (
                <ToggleBtn
                  key={th.key}
                  label={th.label}
                  isActive={theme === th.key}
                  onClick={() => setTheme(th.key)}
                  className="footer-theme-btn"
                />
              ))}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </footer>
  );
}
