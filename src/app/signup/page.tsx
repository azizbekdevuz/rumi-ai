'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useI18n } from '@/lib/i18n/i18n-context';
import { Mail, Lock, Eye, EyeOff, Feather, ArrowRight, ArrowLeft, User } from 'lucide-react';

export default function SignupPage() {
  const { t, language, dir } = useI18n();
  const direction = dir;
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const content = {
    en: {
      title: 'Begin Your Journey',
      subtitle: 'Create an account to explore wisdom',
      name: 'Full Name',
      namePlaceholder: 'Enter your name',
      email: 'Email',
      emailPlaceholder: 'Enter your email',
      password: 'Password',
      passwordPlaceholder: 'Create a password',
      passwordHint: 'At least 8 characters',
      signup: 'Create Account',
      hasAccount: 'Already have an account?',
      login: 'Sign in',
      orContinue: 'Or continue with',
      google: 'Google',
      apple: 'Apple',
      terms: 'By creating an account, you agree to our',
      termsLink: 'Terms of Service',
      and: 'and',
      privacyLink: 'Privacy Policy',
      error: 'Please fill in all fields correctly',
    },
    fa: {
      title: 'سفر خود را آغاز کنید',
      subtitle: 'یک حساب کاربری ایجاد کنید تا حکمت را کشف کنید',
      name: 'نام کامل',
      namePlaceholder: 'نام خود را وارد کنید',
      email: 'ایمیل',
      emailPlaceholder: 'ایمیل خود را وارد کنید',
      password: 'رمز عبور',
      passwordPlaceholder: 'یک رمز عبور ایجاد کنید',
      passwordHint: 'حداقل ۸ کاراکتر',
      signup: 'ایجاد حساب',
      hasAccount: 'قبلاً حساب دارید؟',
      login: 'ورود',
      orContinue: 'یا ادامه با',
      google: 'گوگل',
      apple: 'اپل',
      terms: 'با ایجاد حساب، شما با',
      termsLink: 'شرایط خدمات',
      and: 'و',
      privacyLink: 'سیاست حفظ حریم خصوصی',
      error: 'لطفاً همه فیلدها را به درستی پر کنید',
    },
    kr: {
      title: '여정을 시작하세요',
      subtitle: '지혜를 탐구하기 위한 계정을 만드세요',
      name: '이름',
      namePlaceholder: '이름을 입력하세요',
      email: '이메일',
      emailPlaceholder: '이메일을 입력하세요',
      password: '비밀번호',
      passwordPlaceholder: '비밀번호를 만드세요',
      passwordHint: '최소 8자',
      signup: '계정 만들기',
      hasAccount: '이미 계정이 있으신가요?',
      login: '로그인',
      orContinue: '또는 계속하기',
      google: 'Google',
      apple: 'Apple',
      terms: '계정을 만들면 다음에 동의하는 것입니다',
      termsLink: '서비스 약관',
      and: '및',
      privacyLink: '개인정보 처리방침',
      error: '모든 필드를 올바르게 입력해주세요',
    },
  };

  const c = content[language] || content.en;
  const ArrowIcon = direction === 'rtl' ? ArrowLeft : ArrowRight;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Simulate API call - replace with actual auth
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Mock validation
    if (name && email && password.length >= 8) {
      router.push('/chat');
    } else {
      setError(c.error);
    }
    setIsLoading(false);
  };

  return (
    <main className="auth-page" dir={direction}>
      <div className="auth-container">
        {/* Logo */}
        <div className="text-center mb-10">
          <Link href="/" className="inline-flex items-center justify-center gap-3">
            <Feather className="w-12 h-12 text-[var(--accent-teal)]" />
            <span 
              className="text-3xl font-serif font-bold"
              style={{ color: 'var(--text-primary)' }}
            >
              Rumi AI
            </span>
          </Link>
        </div>

        {/* Card */}
        <div className="auth-card">
          <div className="auth-header">
            <h1 className="auth-title">
              {c.title}
            </h1>
            <p className="auth-subtitle">{c.subtitle}</p>
          </div>

          {error && (
            <div 
              className="mb-8 p-5 rounded-[var(--radius-lg)] text-center"
              style={{ 
                background: 'rgba(198, 40, 40, 0.08)', 
                border: '2px solid rgba(198, 40, 40, 0.15)',
                color: 'var(--error)'
              }}
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            {/* Name */}
            <div className="form-group">
              <label
                htmlFor="name"
                className="form-label"
              >
                {c.name}
              </label>
              <div className="relative">
                <User 
                  className="absolute top-1/2 -translate-y-1/2 w-5 h-5"
                  style={{ 
                    color: 'var(--text-muted)',
                    [direction === 'rtl' ? 'right' : 'left']: '16px'
                  }}
                />
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={c.namePlaceholder}
                  className="form-input"
                  style={{ 
                    [direction === 'rtl' ? 'paddingRight' : 'paddingLeft']: '48px'
                  }}
                  required
                />
              </div>
            </div>

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
              <label
                htmlFor="password"
                className="form-label"
              >
                {c.password}
              </label>
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
                  minLength={8}
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
              <p className="mt-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>{c.passwordHint}</p>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="auth-submit flex items-center justify-center gap-2"
              style={{ opacity: isLoading ? 0.6 : 1, cursor: isLoading ? 'not-allowed' : 'pointer' }}
            >
              {isLoading ? (
                <div 
                  className="w-5 h-5 rounded-full animate-spin"
                  style={{ border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white' }}
                />
              ) : (
                <>
                  {c.signup}
                  <ArrowIcon className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          {/* Terms */}
          <p className="text-sm text-center mt-6" style={{ color: 'var(--text-muted)', lineHeight: '1.6' }}>
            {c.terms}{' '}
            <Link href="/terms" className="hover:underline font-medium" style={{ color: 'var(--accent-teal)' }}>
              {c.termsLink}
            </Link>{' '}
            {c.and}{' '}
            <Link href="/privacy" className="hover:underline font-medium" style={{ color: 'var(--accent-teal)' }}>
              {c.privacyLink}
            </Link>
          </p>

          {/* Divider */}
          <div className="flex items-center gap-5 my-8">
            <div className="flex-1 h-px" style={{ background: 'var(--border-color)' }} />
            <span className="text-sm px-2" style={{ color: 'var(--text-muted)' }}>{c.orContinue}</span>
            <div className="flex-1 h-px" style={{ background: 'var(--border-color)' }} />
          </div>

          {/* Social Login */}
          <div className="grid grid-cols-2 gap-4">
            <button 
              className="py-4 px-5 rounded-[var(--radius-lg)] font-medium flex items-center justify-center gap-3 transition-all hover:shadow-md"
              style={{ 
                border: '2px solid var(--border-color)', 
                background: 'var(--bg-primary)', 
                color: 'var(--text-primary)' 
              }}
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
            </button>
            <button 
              className="py-4 px-5 rounded-[var(--radius-lg)] font-medium flex items-center justify-center gap-3 transition-all hover:shadow-md"
              style={{ 
                border: '2px solid var(--border-color)', 
                background: 'var(--bg-primary)', 
                color: 'var(--text-primary)' 
              }}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
              </svg>
              {c.apple}
            </button>
          </div>

          {/* Login Link */}
          <div className="auth-footer">
            <p>
              {c.hasAccount}{' '}
              <Link href="/login" className="auth-link">
                {c.login}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
