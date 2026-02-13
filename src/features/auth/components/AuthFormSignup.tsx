'use client';

import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useReducedMotion } from '@/lib/hooks';

interface AuthFormSignupProps {
  email: string;
  password: string;
  confirmPassword: string;
  showPassword: boolean;
  showConfirmPassword: boolean;
  isLoading: boolean;
  error: string;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onConfirmPasswordChange: (value: string) => void;
  onShowPasswordToggle: () => void;
  onShowConfirmPasswordToggle: () => void;
  onSubmit: (e: React.FormEvent) => void;
  direction: 'ltr' | 'rtl';
  content: {
    email: string;
    emailPlaceholder: string;
    password: string;
    passwordPlaceholder: string;
    confirmPassword: string;
    confirmPasswordPlaceholder: string;
    passwordHint: string;
    signup: string;
  };
}

export default function AuthFormSignup({
  email,
  password,
  confirmPassword,
  showPassword,
  showConfirmPassword,
  isLoading,
  error,
  onEmailChange,
  onPasswordChange,
  onConfirmPasswordChange,
  onShowPasswordToggle,
  onShowConfirmPasswordToggle,
  onSubmit,
  direction,
  content,
}: AuthFormSignupProps) {
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
        <label htmlFor="auth-signup-email" className="auth-form-label">
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
            id="auth-signup-email"
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
        <label htmlFor="auth-signup-password" className="auth-form-label">
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
            id="auth-signup-password"
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
            minLength={8}
            autoComplete="new-password"
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
        <p className="auth-password-hint">{content.passwordHint}</p>
      </div>

      {/* Confirm Password */}
      <div className="auth-form-group">
        <label htmlFor="auth-signup-confirm-password" className="auth-form-label">
          {content.confirmPassword}
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
            id="auth-signup-confirm-password"
            type={showConfirmPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => onConfirmPasswordChange(e.target.value)}
            placeholder={content.confirmPasswordPlaceholder}
            className="auth-input"
            style={{
              [direction === 'rtl' ? 'paddingRight' : 'paddingLeft']: '48px',
              [direction === 'rtl' ? 'paddingLeft' : 'paddingRight']: '48px',
            }}
            required
            minLength={8}
            autoComplete="new-password"
            aria-label={content.confirmPassword}
          />
          <button
            type="button"
            onClick={onShowConfirmPasswordToggle}
            className="auth-password-toggle"
            style={{
              [direction === 'rtl' ? 'left' : 'right']: '16px',
            }}
            aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
          >
            {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Submit Button */}
      <motion.button
        type="submit"
        disabled={isLoading}
        className="auth-submit-button"
        whileHover={reducedMotion || isLoading ? {} : { scale: 1.02 }}
        whileTap={reducedMotion || isLoading ? {} : { scale: 0.98 }}
        aria-label={content.signup}
      >
        {isLoading ? (
          <motion.div
            className="auth-spinner"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            aria-label="Loading"
          />
        ) : (
          content.signup
        )}
      </motion.button>
    </motion.form>
  );
}
