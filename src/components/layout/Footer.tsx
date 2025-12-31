'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { useI18n } from '@/lib/i18n/i18n-context';
import { useTheme } from '@/lib/theme/theme-context';
import { Language } from '@/lib/i18n/translations';
import { RumiLogo } from '@/components/ui/icons';
import { Heart, Github, Twitter, Mail } from 'lucide-react';
import { useReducedMotion } from '@/lib/hooks/use-reduced-motion';

// =============================================================================
// ANIMATED SOCIAL LINK
// =============================================================================

interface SocialLinkProps {
  href: string;
  label: string;
  icon: React.ReactNode;
}

function SocialLink({ href, label, icon }: SocialLinkProps) {
  const prefersReducedMotion = useReducedMotion();
  
  return (
    <motion.a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--accent-teal)] hover:bg-[var(--accent-teal-light)] transition-colors"
      aria-label={label}
      whileHover={prefersReducedMotion ? undefined : { scale: 1.1, y: -2 }}
      whileTap={prefersReducedMotion ? undefined : { scale: 0.95 }}
      transition={{ type: 'spring' as const, stiffness: 400, damping: 15 }}
    >
      {icon}
    </motion.a>
  );
}

// =============================================================================
// ANIMATED FOOTER LINK
// =============================================================================

interface FooterLinkProps {
  href: string;
  children: React.ReactNode;
  external?: boolean;
}

function FooterLink({ href, children, external }: FooterLinkProps) {
  const prefersReducedMotion = useReducedMotion();
  
  const linkProps = external ? {
    target: '_blank',
    rel: 'noopener noreferrer',
  } : {};

  const Component = external ? 'a' : Link;

  return (
    <motion.div
      whileHover={prefersReducedMotion ? undefined : { x: 4 }}
      transition={{ type: 'spring' as const, stiffness: 400, damping: 20 }}
    >
      <Component href={href} className="footer-link" {...linkProps}>
        {children}
      </Component>
    </motion.div>
  );
}

// =============================================================================
// ANIMATED BUTTON GROUP
// =============================================================================

interface ButtonGroupProps {
  items: Array<{ key: string; label: string; isActive: boolean; onClick: () => void }>;
  ariaLabel: string;
}

function AnimatedButtonGroup({ items, ariaLabel }: ButtonGroupProps) {
  const prefersReducedMotion = useReducedMotion();
  
  return (
    <div className="footer-language" role="group" aria-label={ariaLabel}>
      {items.map((item) => (
        <motion.button
          key={item.key}
          onClick={item.onClick}
          className={`footer-lang-btn ${item.isActive ? 'active' : ''}`}
          aria-pressed={item.isActive}
          whileHover={prefersReducedMotion ? undefined : { scale: 1.05 }}
          whileTap={prefersReducedMotion ? undefined : { scale: 0.95 }}
          transition={{ type: 'spring' as const, stiffness: 400, damping: 20 }}
        >
          {item.label}
        </motion.button>
      ))}
    </div>
  );
}

// =============================================================================
// MAIN FOOTER
// =============================================================================

export default function Footer() {
  const { language, setLanguage, t } = useI18n();
  const { theme, toggleTheme } = useTheme();
  const prefersReducedMotion = useReducedMotion();

  const languages: Language[] = ['fa', 'en', 'kr'];

  const content = {
    en: {
      copyright: '© 2024 Rumi AI. All rights reserved.',
      madeWith: 'Made with',
      forSeekers: 'for seekers of wisdom',
      privacy: 'Privacy',
      terms: 'Terms',
      contact: 'Contact',
    },
    fa: {
      copyright: '© ۲۰۲۴ رومی AI. تمام حقوق محفوظ است.',
      madeWith: 'ساخته شده با',
      forSeekers: 'برای جویندگان حکمت',
      privacy: 'حریم خصوصی',
      terms: 'شرایط',
      contact: 'تماس',
    },
    kr: {
      copyright: '© 2024 Rumi AI. 모든 권리 보유.',
      madeWith: '만들어짐',
      forSeekers: '지혜를 찾는 자들을 위해',
      privacy: '개인정보',
      terms: '이용약관',
      contact: '연락처',
    },
  };

  const c = content[language] || content.en;

  // Animation variants for staggered reveal
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
          <Link href="/" className="flex items-center gap-2 mb-4 group">
            <motion.div
              whileHover={prefersReducedMotion ? undefined : { rotate: 10, scale: 1.1 }}
              transition={{ type: 'spring' as const, stiffness: 400, damping: 15 }}
            >
              <RumiLogo className="w-8 h-8" />
            </motion.div>
            <span className="text-lg font-serif font-bold text-[var(--text-primary)]">
              Rumi AI
            </span>
          </Link>
          <p className="footer-tagline">{t.footer.tagline}</p>
          
          {/* Social Links */}
          <div className="flex items-center gap-3 mt-4">
            <SocialLink
              href="https://github.com"
              label="GitHub"
              icon={<Github className="w-5 h-5" />}
            />
            <SocialLink
              href="https://twitter.com"
              label="Twitter"
              icon={<Twitter className="w-5 h-5" />}
            />
            <SocialLink
              href="mailto:contact@rumi-ai.com"
              label="Email"
              icon={<Mail className="w-5 h-5" />}
            />
          </div>
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

        {/* Legal */}
        <motion.div className="footer-column" variants={itemVariants}>
          <h3 className="footer-heading">{c.contact}</h3>
          <nav className="footer-links" aria-label="Legal links">
            <FooterLink href="/privacy">{c.privacy}</FooterLink>
            <FooterLink href="/terms">{c.terms}</FooterLink>
            <FooterLink href="mailto:contact@rumi-ai.com" external>
              {c.contact}
            </FooterLink>
          </nav>
        </motion.div>
      </motion.div>

      {/* Bottom Bar */}
      <motion.div
        className="border-t border-[var(--border-color)] mt-8 pt-6"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 0.5, duration: 0.5 }}
      >
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-[var(--text-muted)]">
          <p>{c.copyright}</p>
          <motion.p 
            className="flex items-center gap-1"
            whileHover={prefersReducedMotion ? undefined : { scale: 1.02 }}
          >
            {c.madeWith}
            <motion.span
              animate={prefersReducedMotion ? undefined : {
                scale: [1, 1.2, 1],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            >
              <Heart className="w-4 h-4 text-red-500 fill-red-500" />
            </motion.span>
            {c.forSeekers}
          </motion.p>
        </div>
      </motion.div>
    </footer>
  );
}
