'use client';

import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useReducedMotion } from '@/lib/hooks';
import Link from 'next/link';

interface AuthFormLoginProps {
  email: string;
  password: string;
  showPassword: boolean;
  rememberMe: boolean;
  isLoading: boolean;
  error: string;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onShowPasswordToggle: () => void;
  onRememberMeChange: (value: boolean) => void;
  onSubmit: (e: React.FormEvent) => void;
  direction: 'ltr' | 'rtl';
  content: {
    email: string;
    emailPlaceholder: string;
    password: string;
    passwordPlaceholder: string;
    rememberMe: string;
    forgotPassword: string;
    login: string;
  };
}

export default function AuthFormLogin({
  email,
  password,
  showPassword,
  rememberMe,
  isLoading,
  error,
  onEmailChange,
  onPasswordChange,
  onShowPasswordToggle,
  onRememberMeChange,
  onSubmit,
  direction,
  content,
}: AuthFormLoginProps) {
  const reducedMotion = useReducedMotion();

  return (
    <motion.form
      id="auth-form-content"
      onSubmit={onSubmit}
      className="auth-form"
      initial={reducedMotion ? {} : { opacity: 0, y: 10 }}
      animate={reducedMotion ? {} : { opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <AnimatePresence>
        {error && (
          <motion.div
            className="auth-error"
            initial={{ opacity: 0, y: -10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -10, height: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          >
            {typeof error === "string" ? error : "Unknown error occurred, please try again"}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Email */}
      <div className="auth-form-group">
        <label htmlFor="auth-email" className="auth-form-label">
          {content.email}
        </label>
        <div className="auth-input-wrapper">
          <Mail
            className="auth-input-icon"
            style={{
              [direction === 'rtl' ? 'right' : 'left']: '16px',
            }}
            aria-hidden="true"
          />
          <input
            id="auth-email"
            type="email"
            value={email}
            onChange={(e) => onEmailChange(e.target.value)}
            placeholder={content.emailPlaceholder}
            className="auth-input"
            style={{
              [direction === 'rtl' ? 'paddingRight' : 'paddingLeft']: '48px',
            }}
            required
            autoComplete="email"
            aria-label={content.email}
          />
        </div>
      </div>

      {/* Password */}
      <div className="auth-form-group">
        <label htmlFor="auth-password" className="auth-form-label">
          {content.password}
        </label>
        <div className="auth-input-wrapper">
          <Lock
            className="auth-input-icon"
            style={{
              [direction === 'rtl' ? 'right' : 'left']: '16px',
            }}
            aria-hidden="true"
          />
          <input
            id="auth-password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => onPasswordChange(e.target.value)}
            placeholder={content.passwordPlaceholder}
            className="auth-input"
            style={{
              [direction === 'rtl' ? 'paddingRight' : 'paddingLeft']: '48px',
              [direction === 'rtl' ? 'paddingLeft' : 'paddingRight']: '48px',
            }}
            required
            autoComplete="current-password"
            aria-label={content.password}
          />
          <button
            type="button"
            onClick={onShowPasswordToggle}
            className="auth-password-toggle"
            style={{
              [direction === 'rtl' ? 'left' : 'right']: '16px',
            }}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Remember Me + Forgot Password */}
      <div className="auth-form-row">
        <label className="auth-checkbox-label">
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => onRememberMeChange(e.target.checked)}
            className="auth-checkbox"
            aria-label={content.rememberMe}
          />
          <span>{content.rememberMe}</span>
        </label>
        <Link href="/forgot-password" className="auth-forgot-link">
          {content.forgotPassword}
        </Link>
      </div>

      {/* Submit Button */}
      <motion.button
        type="submit"
        disabled={isLoading}
        className="auth-submit-button"
        whileHover={reducedMotion || isLoading ? {} : { scale: 1.02 }}
        whileTap={reducedMotion || isLoading ? {} : { scale: 0.98 }}
        aria-label={content.login}
      >
        {isLoading ? (
          <motion.div
            className="auth-spinner"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            aria-label="Loading"
          />
        ) : (
          content.login
        )}
      </motion.button>
    </motion.form>
  );
}
