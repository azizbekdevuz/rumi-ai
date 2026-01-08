'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useI18n } from '@/lib/i18n/i18n-context';
import { Mail, Lock, Eye, EyeOff, Feather, ArrowRight, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { motion as motionTokens } from '@/lib/design-system/motion';
import { useReducedMotion } from '@/lib/hooks';

export default function LoginPage() {
  const { t, language, dir } = useI18n();
  const direction = dir;
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const reducedMotion = useReducedMotion();

  const content = {
    en: {
      title: 'Welcome Back',
      subtitle: 'Continue your journey with Rumi',
      email: 'Email',
      emailPlaceholder: 'Enter your email',
      password: 'Password',
      passwordPlaceholder: 'Enter your password',
      forgotPassword: 'Forgot password?',
      login: 'Sign In',
      noAccount: "Don't have an account?",
      signup: 'Create one',
      orContinue: 'Or continue with',
      google: 'Google',
      apple: 'Apple',
      error: 'Invalid email or password',
    },
    fa: {
      title: 'خوش آمدید',
      subtitle: 'سفر خود را با مولانا ادامه دهید',
      email: 'ایمیل',
      emailPlaceholder: 'ایمیل خود را وارد کنید',
      password: 'رمز عبور',
      passwordPlaceholder: 'رمز عبور خود را وارد کنید',
      forgotPassword: 'رمز عبور را فراموش کردید؟',
      login: 'ورود',
      noAccount: 'حساب کاربری ندارید؟',
      signup: 'ایجاد حساب',
      orContinue: 'یا ادامه با',
      google: 'گوگل',
      apple: 'اپل',
      error: 'ایمیل یا رمز عبور نادرست',
    },
    kr: {
      title: '다시 오신 것을 환영합니다',
      subtitle: '루미와 함께 여정을 계속하세요',
      email: '이메일',
      emailPlaceholder: '이메일을 입력하세요',
      password: '비밀번호',
      passwordPlaceholder: '비밀번호를 입력하세요',
      forgotPassword: '비밀번호를 잊으셨나요?',
      login: '로그인',
      noAccount: '계정이 없으신가요?',
      signup: '계정 만들기',
      orContinue: '또는 계속하기',
      google: 'Google',
      apple: 'Apple',
      error: '이메일 또는 비밀번호가 잘못되었습니다',
    },
  };

  const c = content[language] || content.en;
  const ArrowIcon = direction === 'rtl' ? ArrowLeft : ArrowRight;

  const fadeUpVariants = reducedMotion ? motionTokens.variants.reducedMotion : motionTokens.variants.fadeUp;
  const staggerVariants = reducedMotion ? motionTokens.variants.reducedMotion : motionTokens.variants.staggerContainer;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Simulate API call - replace with actual auth
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Mock validation
    if (email && password) {
      router.push('/chat');
    } else {
      setError(c.error);
    }
    setIsLoading(false);
  };

  return (
    <main className="auth-page" dir={direction}>
      <motion.div 
        className="auth-container"
        initial="initial"
        animate="animate"
        variants={staggerVariants}
      >
        {/* Logo */}
        <motion.div 
          className="text-center mb-10"
          variants={fadeUpVariants}
        >
          <Link href="/" className="inline-flex items-center justify-center gap-3">
            <motion.div
              whileHover={reducedMotion ? {} : { rotate: 15, scale: 1.1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 15 }}
            >
              <Feather className="w-12 h-12 text-[var(--accent-teal)]" />
            </motion.div>
            <span 
              className="text-3xl font-serif font-bold"
              style={{ color: 'var(--text-primary)' }}
            >
              Rumi AI
            </span>
          </Link>
        </motion.div>

        {/* Card */}
        <motion.div 
          className="auth-card"
          variants={fadeUpVariants}
          transition={{ delay: 0.1 }}
        >
          <div className="auth-header">
            <motion.h1 
              className="auth-title"
              variants={fadeUpVariants}
              transition={{ delay: 0.15 }}
            >
              {c.title}
            </motion.h1>
            <motion.p 
              className="auth-subtitle"
              variants={fadeUpVariants}
              transition={{ delay: 0.2 }}
            >
              {c.subtitle}
            </motion.p>
          </div>

          <AnimatePresence>
            {error && (
              <motion.div 
                className="mb-8 p-5 rounded-[var(--radius-lg)] text-center"
                style={{ 
                  background: 'rgba(198, 40, 40, 0.08)', 
                  border: '2px solid rgba(198, 40, 40, 0.15)',
                  color: 'var(--error)'
                }}
                initial={{ opacity: 0, y: -10, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, y: -10, height: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="auth-form">
            {/* Email */}
            <div className="form-group">
              <label
                htmlFor="email"
                className="form-label"
              >
                {c.email}
              </label>
              <div className="relative">
                <Mail 
                  className="absolute top-1/2 -translate-y-1/2 w-5 h-5"
                  style={{ 
                    color: 'var(--text-muted)',
                    [direction === 'rtl' ? 'right' : 'left']: '16px'
                  }} 
                />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={c.emailPlaceholder}
                  className="form-input"
                  style={{ 
                    [direction === 'rtl' ? 'paddingRight' : 'paddingLeft']: '48px'
                  }}
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="form-group">
              <div className="flex items-center justify-between mb-2">
                <label
                  htmlFor="password"
                  className="form-label"
                  style={{ marginBottom: 0 }}
                >
                  {c.password}
                </label>
                <Link
                  href="/forgot-password"
                  className="text-sm hover:underline"
                  style={{ color: 'var(--accent-teal)' }}
                >
                  {c.forgotPassword}
                </Link>
              </div>
              <div className="relative">
                <Lock 
                  className="absolute top-1/2 -translate-y-1/2 w-5 h-5"
                  style={{ 
                    color: 'var(--text-muted)',
                    [direction === 'rtl' ? 'right' : 'left']: '16px'
                  }}
                />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={c.passwordPlaceholder}
                  className="form-input"
                  style={{ 
                    [direction === 'rtl' ? 'paddingRight' : 'paddingLeft']: '48px',
                    [direction === 'rtl' ? 'paddingLeft' : 'paddingRight']: '48px'
                  }}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute top-1/2 -translate-y-1/2 transition-colors"
                  style={{ 
                    color: 'var(--text-muted)',
                    [direction === 'rtl' ? 'left' : 'right']: '16px'
                  }}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <motion.button
              type="submit"
              disabled={isLoading}
              className="auth-submit flex items-center justify-center gap-2"
              style={{ opacity: isLoading ? 0.6 : 1, cursor: isLoading ? 'not-allowed' : 'pointer' }}
              whileHover={reducedMotion || isLoading ? {} : { scale: 1.02 }}
              whileTap={reducedMotion || isLoading ? {} : { scale: 0.98 }}
            >
              {isLoading ? (
                <motion.div 
                  className="w-5 h-5 rounded-full"
                  style={{ border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white' }}
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                />
              ) : (
                <>
                  {c.login}
                  <motion.span
                    initial={{ x: 0 }}
                    animate={{ x: 0 }}
                    whileHover={{ x: 4 }}
                  >
                    <ArrowIcon className="w-5 h-5" />
                  </motion.span>
                </>
              )}
            </motion.button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-5 my-8">
            <div className="flex-1 h-px" style={{ background: 'var(--border-color)' }} />
            <span className="text-sm px-2" style={{ color: 'var(--text-muted)' }}>{c.orContinue}</span>
            <div className="flex-1 h-px" style={{ background: 'var(--border-color)' }} />
          </div>

          {/* Social Login */}
          <motion.div 
            className="grid grid-cols-2 gap-4"
            variants={fadeUpVariants}
            transition={{ delay: 0.3 }}
          >
            <motion.button 
              className="py-4 px-5 rounded-[var(--radius-lg)] font-medium flex items-center justify-center gap-3 transition-all"
              style={{ 
                border: '2px solid var(--border-color)', 
                background: 'var(--bg-primary)', 
                color: 'var(--text-primary)' 
              }}
              whileHover={reducedMotion ? {} : { y: -2, boxShadow: 'var(--shadow-md)' }}
              whileTap={reducedMotion ? {} : { scale: 0.98 }}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              {c.google}
            </motion.button>
            <motion.button 
              className="py-4 px-5 rounded-[var(--radius-lg)] font-medium flex items-center justify-center gap-3 transition-all"
              style={{ 
                border: '2px solid var(--border-color)', 
                background: 'var(--bg-primary)', 
                color: 'var(--text-primary)' 
              }}
              whileHover={reducedMotion ? {} : { y: -2, boxShadow: 'var(--shadow-md)' }}
              whileTap={reducedMotion ? {} : { scale: 0.98 }}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
              </svg>
              {c.apple}
            </motion.button>
          </motion.div>

          {/* Signup Link */}
          <motion.div 
            className="auth-footer"
            variants={fadeUpVariants}
            transition={{ delay: 0.4 }}
          >
            <p>
              {c.noAccount}{' '}
              <Link href="/signup" className="auth-link">
                {c.signup}
              </Link>
            </p>
          </motion.div>
        </motion.div>
      </motion.div>
    </main>
  );
}
