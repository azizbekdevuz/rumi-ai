'use client';

import Link from 'next/link';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useI18n } from '@/lib/i18n/i18n-context';
import { useTheme } from '@/lib/theme/theme-context';
import { Language } from '@/lib/i18n/translations';
import { RumiLogo, MoonIcon, SunIcon, MenuIcon, CloseIcon } from '@/components/ui/icons';
import { FeedbackModal } from '@/components/feedback/FeedbackModal';
import { User, MessageSquareText, LogIn } from 'lucide-react';
import { useReducedMotion } from '@/lib/hooks/use-reduced-motion';

// =============================================================================
// ANIMATED NAV LINK
// =============================================================================

interface NavLinkProps {
  href: string;
  children: React.ReactNode;
  onClick?: () => void;
}

function AnimatedNavLink({ href, children, onClick }: NavLinkProps) {
  const prefersReducedMotion = useReducedMotion();
  
  return (
    <Link href={href} className="nav-link group relative" onClick={onClick}>
      {children}
      {!prefersReducedMotion && (
        <motion.span
          className="absolute bottom-0 left-0 h-[2px] bg-[var(--accent-teal)] origin-left"
          initial={{ scaleX: 0 }}
          whileHover={{ scaleX: 1 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          style={{ width: '100%' }}
        />
      )}
    </Link>
  );
}

// =============================================================================
// LANGUAGE SWITCH WITH ANIMATION
// =============================================================================

interface LanguageSwitchProps {
  languages: Language[];
  currentLang: Language;
  onSelect: (lang: Language) => void;
}

function AnimatedLanguageSwitch({ languages, currentLang, onSelect }: LanguageSwitchProps) {
  const prefersReducedMotion = useReducedMotion();
  
  return (
    <div className="language-switch" role="group" aria-label="Language selection">
      {languages.map((lang) => (
        <motion.button
          key={lang}
          onClick={() => onSelect(lang)}
          className={`lang-btn ${currentLang === lang ? 'active' : ''}`}
          aria-pressed={currentLang === lang}
          aria-label={`Switch to ${lang === 'fa' ? 'Persian' : lang === 'kr' ? 'Korean' : 'English'}`}
          whileHover={prefersReducedMotion ? undefined : { scale: 1.05 }}
          whileTap={prefersReducedMotion ? undefined : { scale: 0.95 }}
          transition={{ type: 'spring' as const, stiffness: 400, damping: 20 }}
        >
          {lang.toUpperCase()}
        </motion.button>
      ))}
    </div>
  );
}

// =============================================================================
// THEME TOGGLE WITH ANIMATION
// =============================================================================

interface ThemeToggleProps {
  theme: 'light' | 'dark';
  onToggle: () => void;
}

function AnimatedThemeToggle({ theme, onToggle }: ThemeToggleProps) {
  const prefersReducedMotion = useReducedMotion();
  
  return (
    <motion.button
      onClick={onToggle}
      className="theme-toggle"
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      whileHover={prefersReducedMotion ? undefined : { scale: 1.1, rotate: 15 }}
      whileTap={prefersReducedMotion ? undefined : { scale: 0.9 }}
      transition={{ type: 'spring' as const, stiffness: 400, damping: 15 }}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={theme}
          initial={prefersReducedMotion ? undefined : { rotate: -90, opacity: 0 }}
          animate={{ rotate: 0, opacity: 1 }}
          exit={prefersReducedMotion ? undefined : { rotate: 90, opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {theme === 'light' ? <MoonIcon /> : <SunIcon />}
        </motion.div>
      </AnimatePresence>
    </motion.button>
  );
}

// =============================================================================
// MOBILE MENU
// =============================================================================

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  links: Array<{ href: string; label: string }>;
  languages: Language[];
  currentLang: Language;
  onSelectLang: (lang: Language) => void;
  feedbackLabel: string;
  onFeedbackClick: () => void;
  loginLabel: string;
  profileLabel: string;
  isAuthenticated: boolean;
}

function MobileMenu({
  isOpen,
  onClose,
  links,
  languages,
  currentLang,
  onSelectLang,
  feedbackLabel,
  onFeedbackClick,
  loginLabel,
  profileLabel,
  isAuthenticated,
}: MobileMenuProps) {
  const prefersReducedMotion = useReducedMotion();

  const menuVariants = {
    closed: {
      opacity: 0,
      height: 0,
      transition: {
        duration: prefersReducedMotion ? 0 : 0.3,
        ease: [0.16, 1, 0.3, 1] as const,
      },
    },
    open: {
      opacity: 1,
      height: 'auto',
      transition: {
        duration: prefersReducedMotion ? 0 : 0.3,
        ease: [0.16, 1, 0.3, 1] as const,
        staggerChildren: prefersReducedMotion ? 0 : 0.05,
        delayChildren: prefersReducedMotion ? 0 : 0.1,
      },
    },
  };

  const itemVariants = {
    closed: { opacity: 0, x: -10 },
    open: { 
      opacity: 1, 
      x: 0,
      transition: {
        duration: 0.2,
        ease: [0.16, 1, 0.3, 1] as const,
      },
    },
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="mobile-menu open"
          variants={menuVariants}
          initial="closed"
          animate="open"
          exit="closed"
        >
          {links.map((link, index) => (
            <motion.div key={link.href} variants={itemVariants}>
              <Link href={link.href} className="mobile-nav-link" onClick={onClose}>
                {link.label}
              </Link>
            </motion.div>
          ))}

          {/* Mobile Auth */}
          <motion.div variants={itemVariants}>
            {isAuthenticated ? (
              <Link href="/profile" className="mobile-nav-link" onClick={onClose}>
                {profileLabel}
              </Link>
            ) : (
              <Link href="/login" className="mobile-nav-link" onClick={onClose}>
                {loginLabel}
              </Link>
            )}
          </motion.div>

          {/* Mobile Feedback */}
          <motion.div variants={itemVariants}>
            <button
              onClick={() => {
                onClose();
                onFeedbackClick();
              }}
              className="mobile-nav-link text-start w-full"
            >
              {feedbackLabel}
            </button>
          </motion.div>

          {/* Mobile language switch */}
          <motion.div variants={itemVariants} style={{ marginTop: '16px' }}>
            <AnimatedLanguageSwitch
              languages={languages}
              currentLang={currentLang}
              onSelect={(lang) => {
                onSelectLang(lang);
                onClose();
              }}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// =============================================================================
// USER DROPDOWN
// =============================================================================

interface UserDropdownProps {
  isOpen: boolean;
  onToggle: () => void;
  profileLabel: string;
  onClose: () => void;
}

function UserDropdown({ isOpen, onToggle, profileLabel, onClose }: UserDropdownProps) {
  const prefersReducedMotion = useReducedMotion();

  const dropdownVariants = {
    closed: {
      opacity: 0,
      scale: 0.95,
      y: -10,
      transition: {
        duration: prefersReducedMotion ? 0 : 0.15,
      },
    },
    open: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        duration: prefersReducedMotion ? 0 : 0.2,
        ease: [0.16, 1, 0.3, 1] as const,
      },
    },
  };

  return (
    <div className="relative hidden md:block">
      <motion.button
        onClick={onToggle}
        className="p-2 rounded-full transition-colors"
        style={{
          background: 'var(--accent-teal-light)',
          color: 'var(--accent-teal)',
        }}
        aria-label="User menu"
        aria-expanded={isOpen}
        whileHover={prefersReducedMotion ? undefined : { scale: 1.1 }}
        whileTap={prefersReducedMotion ? undefined : { scale: 0.95 }}
      >
        <User className="w-5 h-5" />
      </motion.button>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="absolute top-full end-0 mt-2 w-48 py-2 rounded-[var(--radius-md)] z-50"
            style={{
              background: 'var(--bg-tertiary)',
              boxShadow: 'var(--shadow-lg)',
              border: '1px solid var(--border-color)',
            }}
            variants={dropdownVariants}
            initial="closed"
            animate="open"
            exit="closed"
          >
            <Link
              href="/profile"
              className="block px-4 py-2 text-sm transition-colors hover:bg-[var(--accent-teal-light)]"
              style={{ color: 'var(--text-primary)' }}
              onClick={onClose}
            >
              {profileLabel}
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// =============================================================================
// MAIN NAVBAR
// =============================================================================

export default function Navbar() {
  const { language, setLanguage, t } = useI18n();
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  // Mock auth state - replace with actual auth
  const isAuthenticated = false;

  const languages: Language[] = ['fa', 'en', 'kr'];

  const feedbackLabel = {
    en: 'Feedback',
    fa: 'بازخورد',
    kr: '피드백',
  };

  const loginLabel = {
    en: 'Sign In',
    fa: 'ورود',
    kr: '로그인',
  };

  const profileLabel = {
    en: 'Profile',
    fa: 'پروفایل',
    kr: '프로필',
  };

  const navLinks = [
    { href: '/', label: t.nav.home },
    { href: '/chat', label: t.nav.chat },
    { href: '/books', label: t.nav.books },
    { href: '/about', label: t.nav.about },
  ];

  return (
    <>
      <header className="navbar" role="banner">
        <div className="navbar-container">
          {/* Logo */}
          <div className="navbar-logo">
            <Link href="/" className="logo-link">
              <motion.div
                whileHover={prefersReducedMotion ? undefined : { rotate: 5, scale: 1.05 }}
                transition={{ type: 'spring' as const, stiffness: 400, damping: 15 }}
              >
                <RumiLogo className="logo-icon" />
              </motion.div>
              <span className="logo-text">Rumi AI Agent</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="navbar-nav" role="navigation" aria-label="Main navigation">
            {navLinks.map((link) => (
              <AnimatedNavLink key={link.href} href={link.href}>
                {link.label}
              </AnimatedNavLink>
            ))}
          </nav>

          {/* Controls */}
          <div className="navbar-controls">
            {/* Feedback Button */}
            <motion.button
              onClick={() => setFeedbackOpen(true)}
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors"
              style={{ color: 'var(--text-secondary)' }}
              whileHover={prefersReducedMotion ? undefined : {
                color: 'var(--accent-teal)',
                backgroundColor: 'var(--accent-teal-light)',
              }}
              whileTap={prefersReducedMotion ? undefined : { scale: 0.95 }}
              aria-label={feedbackLabel[language] || feedbackLabel.en}
            >
              <MessageSquareText className="w-4 h-4" />
              <span className="hidden lg:inline">{feedbackLabel[language] || feedbackLabel.en}</span>
            </motion.button>

            {/* Language Switch */}
            <AnimatedLanguageSwitch
              languages={languages}
              currentLang={language}
              onSelect={setLanguage}
            />

            {/* Theme Toggle */}
            <AnimatedThemeToggle theme={theme} onToggle={toggleTheme} />

            {/* Auth Button */}
            {isAuthenticated ? (
              <UserDropdown
                isOpen={userMenuOpen}
                onToggle={() => setUserMenuOpen(!userMenuOpen)}
                profileLabel={profileLabel[language] || profileLabel.en}
                onClose={() => setUserMenuOpen(false)}
              />
            ) : (
              <motion.div
                whileHover={prefersReducedMotion ? undefined : { scale: 1.02, y: -1 }}
                whileTap={prefersReducedMotion ? undefined : { scale: 0.98 }}
              >
                <Link
                  href="/login"
                  className="hidden md:flex items-center gap-1.5 px-4 py-2 rounded-[var(--radius-md)] text-sm font-medium transition-colors"
                  style={{
                    background: 'var(--gradient-teal)',
                    color: 'var(--text-inverse)',
                    boxShadow: '0 2px 8px rgba(27, 123, 107, 0.25)',
                  }}
                >
                  <LogIn className="w-4 h-4" />
                  <span>{loginLabel[language] || loginLabel.en}</span>
                </Link>
              </motion.div>
            )}

            {/* Mobile Menu Toggle */}
            <motion.button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="mobile-menu-toggle"
              aria-label="Toggle mobile menu"
              aria-expanded={mobileMenuOpen}
              whileTap={prefersReducedMotion ? undefined : { scale: 0.9 }}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={mobileMenuOpen ? 'close' : 'menu'}
                  initial={prefersReducedMotion ? undefined : { rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={prefersReducedMotion ? undefined : { rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {mobileMenuOpen ? <CloseIcon /> : <MenuIcon />}
                </motion.div>
              </AnimatePresence>
            </motion.button>
          </div>
        </div>

        {/* Mobile Menu */}
        <MobileMenu
          isOpen={mobileMenuOpen}
          onClose={() => setMobileMenuOpen(false)}
          links={navLinks}
          languages={languages}
          currentLang={language}
          onSelectLang={setLanguage}
          feedbackLabel={feedbackLabel[language] || feedbackLabel.en}
          onFeedbackClick={() => setFeedbackOpen(true)}
          loginLabel={loginLabel[language] || loginLabel.en}
          profileLabel={profileLabel[language] || profileLabel.en}
          isAuthenticated={isAuthenticated}
        />
      </header>

      {/* Feedback Modal */}
      <FeedbackModal isOpen={feedbackOpen} onClose={() => setFeedbackOpen(false)} />
    </>
  );
}
