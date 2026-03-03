'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { useI18n } from '@/lib/i18n/i18n-context';
import { RumiLogo } from '@/components/ui/icons';
import { useReducedMotion } from '@/lib/hooks/use-reduced-motion';

// =============================================================================
// MODERN COMPACT FOOTER
// =============================================================================

export default function Footer() {
  const { t } = useI18n();
  const prefersReducedMotion = useReducedMotion();

  const navLinks = [
    { href: '/', label: t.nav.home },
    { href: '/chat', label: t.nav.chat },
    { href: '/books', label: t.nav.books },
    { href: '/about', label: t.nav.about },
    { href: '/privacy', label: t.footer.privacy },
    { href: '/contact', label: t.footer.contact },
  ];

  return (
    <footer className="footer" role="contentinfo">
      <motion.div
        className="footer-container"
        initial={prefersReducedMotion ? {} : { opacity: 0, y: 16 }}
        whileInView={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.5 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Top row: brand + nav links */}
        <div className="footer-top">
          <Link href="/" className="footer-brand" aria-label="Rumi AI Home">
            <RumiLogo className="footer-brand-icon" />
            <span className="footer-brand-name">Rumi AI</span>
          </Link>

          <nav className="footer-nav" aria-label="Footer navigation">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href} className="footer-nav-link">
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Separator */}
        <div className="footer-separator" />

        {/* Bottom row: copyright + tagline */}
        <div className="footer-bottom">
          <p className="footer-tagline">{t.footer.tagline}</p>
          <p className="footer-copyright">{t.footer.copyright}</p>
        </div>
      </motion.div>
    </footer>
  );
}
