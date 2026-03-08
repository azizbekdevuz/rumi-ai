'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useReducedMotion } from '@/lib/hooks';

interface SocialButtonsRowProps {
  googleLabel: string;
  appleLabel: string;
  kakaoLabel: string;
  appleComingSoon: string;
}

/**
 * Render a row of social sign-in buttons with a transient toast shown when the Apple button is used.
 *
 * The Google and Kakao buttons initiate OAuth by navigating to their respective start endpoints; the Apple button displays `appleComingSoon` as an inline toast that clears after a short delay.
 *
 * @param appleComingSoon - Message displayed in the transient toast when the Apple button is clicked
 * @returns The component's JSX containing three social sign-in buttons (Google, Kakao, Apple) and a transient toast area
 */
export default function SocialButtonsRow({
  googleLabel,
  appleLabel,
  kakaoLabel,
  appleComingSoon,
}: SocialButtonsRowProps) {
  const reducedMotion = useReducedMotion();
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const handleGoogleClick = () => {
    window.location.assign('/api/auth/google/start');
  };

  const handleKakaoClick = () => {
    window.location.assign('/api/auth/kakao/start');
  };

  const handleAppleClick = () => {
    setToastMessage(appleComingSoon);
  };

  return (
    <div className="auth-social-container">
      <div className="auth-social-row">
        <motion.button
          type="button"
          onClick={handleGoogleClick}
          className="auth-social-button"
          whileHover={reducedMotion ? {} : { y: -2 }}
          whileTap={reducedMotion ? {} : { scale: 0.98 }}
          aria-label={`Sign in with ${googleLabel}`}
        >
          <svg className="auth-social-icon" viewBox="0 0 24 24" aria-hidden="true">
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
          <span>{googleLabel}</span>
        </motion.button>
        <motion.button
          type="button"
          onClick={handleKakaoClick}
          className="auth-social-button auth-social-button-kakao"
          whileHover={reducedMotion ? {} : { y: -2 }}
          whileTap={reducedMotion ? {} : { scale: 0.98 }}
          aria-label={`Sign in with ${kakaoLabel}`}
        >
          {/* Kakao Talk logo SVG */}
          <svg className="auth-social-icon" viewBox="0 0 24 24" aria-hidden="true">
            <path
              fill="#191919"
              d="M12 3C7.031 3 3 6.238 3 10.25c0 2.531 1.641 4.781 4.156 6.063l-.969 3.531c-.094.375.188.656.531.469l4.281-2.844c.313.031.625.031.969.031 4.969 0 9-3.281 9-7.25S16.969 3 12 3z"
            />
          </svg>
          <span>{kakaoLabel}</span>
        </motion.button>
        <motion.button
          type="button"
          onClick={handleAppleClick}
          className="auth-social-button"
          whileHover={reducedMotion ? {} : { y: -2 }}
          whileTap={reducedMotion ? {} : { scale: 0.98 }}
          aria-label={`Sign in with ${appleLabel}`}
        >
          <svg className="auth-social-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
          </svg>
          <span>{appleLabel}</span>
        </motion.button>
      </div>
      {/* Toast notification - appears seamlessly below buttons */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="auth-toast"
            role="alert"
            aria-live="polite"
          >
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
