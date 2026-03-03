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
  const [submitError, setSubmitError] = useState(false);
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
      error: {
        title: 'Something went wrong',
        message: 'We couldn\'t send your feedback right now. Please try again.',
        retry: 'Try Again',
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
      error: {
        title: 'مشکلی پیش آمد',
        message: 'ارسال بازخورد در حال حاضر ممکن نیست. لطفاً دوباره تلاش کنید.',
        retry: 'تلاش مجدد',
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
      error: {
        title: '문제가 발생했습니다',
        message: '피드백을 보낼 수 없습니다. 다시 시도해 주세요.',
        retry: '다시 시도',
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
    setSubmitError(false);

    try {
      const resp = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          message: message.trim(),
        }),
      });

      if (!resp.ok) {
        console.error('[Feedback] Submit failed:', resp.status);
        setSubmitError(true);
        return;
      }

      setIsSubmitted(true);
    } catch (err) {
      console.error('[Feedback] Network error:', err);
      setSubmitError(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setIsSubmitted(false);
    setSubmitError(false);
    setMessage('');
    setEmail('');
    setType('general');
    onClose();
  };

  const handleRetry = () => {
    setSubmitError(false);
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
            <p className="modal-subtitle">{c.subtitle}</p>
          </div>
          <button
            ref={firstFocusableRef}
            onClick={handleClose}
            className="modal-close"
            aria-label="Close"
          >
            <X style={{ width: 18, height: 18 }} />
          </button>
        </div>

        {/* Content */}
        <div className="modal-body">
          {isSubmitted ? (
            <div className="modal-success">
              <div className="modal-success-icon">
                <Heart />
              </div>
              <h3 className="modal-success-title">{c.success.title}</h3>
              <p className="modal-success-text">{c.success.message}</p>
              <button onClick={handleClose} className="modal-success-btn">
                {c.success.close}
              </button>
            </div>
          ) : submitError ? (
            <div className="modal-error">
              <div className="modal-error-icon">
                <X />
              </div>
              <h3 className="modal-error-title">{c.error.title}</h3>
              <p className="modal-error-text">{c.error.message}</p>
              <button onClick={handleRetry} className="modal-error-btn">
                {c.error.retry}
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
                    className={`category-btn ${type === t ? 'active' : ''}`}
                    style={type === t ? {
                      borderColor: 'var(--accent-teal)',
                      background: 'var(--accent-teal-light)',
                      color: 'var(--accent-teal)',
                    } : undefined}
                  >
                    <Icon style={{ width: 22, height: 22 }} />
                    <span>{label}</span>
                  </button>
                ))}
              </div>

              {/* Message */}
              <div>
                <label>{c.message}</label>
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
                <label>{c.email}</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={c.emailPlaceholder}
                  className="form-input"
                />
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isSubmitting || !message.trim()}
                className="feedback-submit"
              >
                {isSubmitting ? (
                  c.submitting
                ) : (
                  <>
                    <Send style={{ width: 18, height: 18 }} />
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
