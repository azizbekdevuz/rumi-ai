'use client';

import { useState, useEffect, useRef } from 'react';
import { useI18n } from '@/lib/i18n/i18n-context';
import { X, MessageSquare, Bug, Lightbulb, Heart, Send } from 'lucide-react';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type FeedbackType = 'general' | 'bug' | 'feature' | 'appreciation';

export function FeedbackModal({ isOpen, onClose }: FeedbackModalProps) {
  const { language, dir } = useI18n();
  const direction = dir;
  const [type, setType] = useState<FeedbackType>('general');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const firstFocusableRef = useRef<HTMLButtonElement>(null);

  const content = {
    en: {
      title: 'Send Feedback',
      subtitle: 'Help us improve Rumi AI',
      types: {
        general: 'General',
        bug: 'Bug Report',
        feature: 'Feature Request',
        appreciation: 'Appreciation',
      },
      message: 'Your Message',
      messagePlaceholder: 'Tell us what\'s on your mind...',
      email: 'Email (optional)',
      emailPlaceholder: 'your@email.com',
      submit: 'Send Feedback',
      submitting: 'Sending...',
      success: {
        title: 'Thank You!',
        message: 'Your feedback has been received. We truly appreciate you taking the time to help us improve.',
        close: 'Close',
      },
    },
    fa: {
      title: 'ارسال بازخورد',
      subtitle: 'به ما کمک کنید رومی AI را بهتر کنیم',
      types: {
        general: 'عمومی',
        bug: 'گزارش باگ',
        feature: 'درخواست ویژگی',
        appreciation: 'قدردانی',
      },
      message: 'پیام شما',
      messagePlaceholder: 'به ما بگویید چه در ذهن دارید...',
      email: 'ایمیل (اختیاری)',
      emailPlaceholder: 'email@example.com',
      submit: 'ارسال بازخورد',
      submitting: 'در حال ارسال...',
      success: {
        title: 'متشکریم!',
        message: 'بازخورد شما دریافت شد. از اینکه وقت گذاشتید تا به ما در بهبود کمک کنید سپاسگزاریم.',
        close: 'بستن',
      },
    },
    kr: {
      title: '피드백 보내기',
      subtitle: 'Rumi AI 개선에 도움을 주세요',
      types: {
        general: '일반',
        bug: '버그 신고',
        feature: '기능 요청',
        appreciation: '감사',
      },
      message: '메시지',
      messagePlaceholder: '무엇이 마음에 있는지 알려주세요...',
      email: '이메일 (선택)',
      emailPlaceholder: 'your@email.com',
      submit: '피드백 보내기',
      submitting: '보내는 중...',
      success: {
        title: '감사합니다!',
        message: '피드백이 접수되었습니다. 개선에 도움을 주시기 위해 시간을 내주셔서 진심으로 감사드립니다.',
        close: '닫기',
      },
    },
  };

  const c = content[language] || content.en;

  const feedbackTypes: { type: FeedbackType; icon: typeof MessageSquare; label: string }[] = [
    { type: 'general', icon: MessageSquare, label: c.types.general },
    { type: 'bug', icon: Bug, label: c.types.bug },
    { type: 'feature', icon: Lightbulb, label: c.types.feature },
    { type: 'appreciation', icon: Heart, label: c.types.appreciation },
  ];

  // Focus trap
  useEffect(() => {
    if (isOpen) {
      firstFocusableRef.current?.focus();
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Escape key handler
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setIsSubmitting(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));

    setIsSubmitted(true);
    setIsSubmitting(false);
  };

  const handleClose = () => {
    setIsSubmitted(false);
    setMessage('');
    setEmail('');
    setType('general');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay"
      dir={direction}
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="feedback-title"
    >
      <div
        ref={modalRef}
        className="modal-content"
        style={{ animationName: 'modal-slide-up', animationDuration: '200ms' }}
      >
        {/* Header */}
        <div className="modal-header">
          <div>
            <h2
              id="feedback-title"
              className="modal-title"
            >
              {c.title}
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>{c.subtitle}</p>
          </div>
          <button
            ref={firstFocusableRef}
            onClick={handleClose}
            className="modal-close"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="modal-body">
          {isSubmitted ? (
            <div className="text-center py-10">
              <div 
                className="w-20 h-20 mx-auto mb-6 rounded-2xl flex items-center justify-center"
                style={{ background: 'rgba(46, 125, 50, 0.1)' }}
              >
                <Heart className="w-10 h-10" style={{ color: 'var(--success)' }} />
              </div>
              <h3 
                className="text-2xl font-serif font-bold mb-4"
                style={{ color: 'var(--text-primary)' }}
              >
                {c.success.title}
              </h3>
              <p 
                className="mb-8 text-base leading-relaxed max-w-sm mx-auto"
                style={{ color: 'var(--text-secondary)' }}
              >
                {c.success.message}
              </p>
              <button
                onClick={handleClose}
                className="py-4 px-8 rounded-[var(--radius-lg)] font-semibold transition-all hover:shadow-lg"
                style={{
                  background: 'var(--gradient-teal)',
                  color: 'var(--text-inverse)'
                }}
              >
                {c.success.close}
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="feedback-form">
              {/* Feedback Type */}
              <div className="feedback-category">
                {feedbackTypes.map(({ type: t, icon: Icon, label }) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setType(t)}
                    className="category-btn"
                    style={{
                      borderColor: type === t ? 'var(--accent-teal)' : 'var(--border-color)',
                      background: type === t ? 'var(--accent-teal-light)' : 'var(--bg-secondary)',
                      color: type === t ? 'var(--accent-teal)' : 'var(--text-secondary)'
                    }}
                  >
                    <Icon className="w-6 h-6" />
                    <span className="text-sm font-medium">{label}</span>
                  </button>
                ))}
              </div>

              {/* Message */}
              <div>
                <label 
                  className="block text-sm font-semibold mb-3"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {c.message}
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={c.messagePlaceholder}
                  rows={5}
                  required
                  className="feedback-textarea"
                />
              </div>

              {/* Email */}
              <div>
                <label 
                  className="block text-sm font-semibold mb-3"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {c.email}
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={c.emailPlaceholder}
                  className="form-input"
                  style={{ width: '100%' }}
                />
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isSubmitting || !message.trim()}
                className="feedback-submit flex items-center justify-center gap-3"
                style={{
                  opacity: (isSubmitting || !message.trim()) ? 0.6 : 1,
                  cursor: (isSubmitting || !message.trim()) ? 'not-allowed' : 'pointer'
                }}
              >
                {isSubmitting ? (
                  <>
                    <div 
                      className="w-5 h-5 rounded-full animate-spin"
                      style={{ 
                        border: '2px solid rgba(255,255,255,0.3)', 
                        borderTopColor: 'white'
                      }}
                    />
                    {c.submitting}
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    {c.submit}
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
