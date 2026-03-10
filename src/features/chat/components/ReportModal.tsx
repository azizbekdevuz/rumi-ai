'use client';

import { useState, useEffect, useRef } from 'react';
import { useI18n } from '@/lib/i18n/i18n-context';
import { X } from 'lucide-react';

/** UUID regex for validating message IDs */
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Specific message ID when reporting a particular message. Omit for session-linked (latest) report. */
  messageId?: string;
  /** Chat session ID for session-linked feedback. Backend resolves latest message when only this is provided. */
  sessionId?: string;
}

type ReportCategory = 'incorrect' | 'offensive' | 'ocr_error' | 'other';

export default function ReportModal({ isOpen, onClose, messageId, sessionId }: ReportModalProps) {
  const { language, dir } = useI18n();
  const direction = dir;
  const [category, setCategory] = useState<ReportCategory>('incorrect');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const firstFocusableRef = useRef<HTMLButtonElement>(null);

  const content = {
    en: {
      title: 'Report Issue',
      issueTypeLabel: 'What type of issue is this?',
      categories: {
        incorrect: 'Incorrect Information',
        offensive: 'Inappropriate Content',
        ocr_error: 'OCR/Text Error',
        other: 'Other',
      },
      descriptionLabel: 'Please describe the issue',
      descriptionPlaceholder: 'Describe what\'s wrong with this response...',
      submit: 'Submit Report',
      submitting: 'Submitting...',
      success: {
        title: 'Thank You!',
        message: 'Your report helps us improve Rumi AI. We appreciate your feedback.',
        close: 'Close',
      },
      error: {
        title: 'Something went wrong',
        message: 'We couldn\'t submit your report right now. Please try again.',
        retry: 'Try Again',
      },
    },
    fa: {
      title: 'گزارش مشکل',
      issueTypeLabel: 'نوع مشکل چیست؟',
      categories: {
        incorrect: 'اطلاعات نادرست',
        offensive: 'محتوای نامناسب',
        ocr_error: 'خطای OCR/متن',
        other: 'سایر',
      },
      descriptionLabel: 'لطفاً مشکل را توضیح دهید',
      descriptionPlaceholder: 'مشکل این پاسخ را شرح دهید...',
      submit: 'ارسال گزارش',
      submitting: 'در حال ارسال...',
      success: {
        title: 'متشکریم!',
        message: 'گزارش شما به بهبود رومی AI کمک می‌کند. از بازخورد شما سپاسگزاریم.',
        close: 'بستن',
      },
      error: {
        title: 'مشکلی پیش آمد',
        message: 'ارسال گزارش در حال حاضر ممکن نیست. لطفاً دوباره تلاش کنید.',
        retry: 'تلاش مجدد',
      },
    },
    kr: {
      title: '문제 신고',
      issueTypeLabel: '어떤 유형의 문제인가요?',
      categories: {
        incorrect: '잘못된 정보',
        offensive: '부적절한 콘텐츠',
        ocr_error: 'OCR/텍스트 오류',
        other: '기타',
      },
      descriptionLabel: '문제를 설명해 주세요',
      descriptionPlaceholder: '이 응답의 문제점을 설명해 주세요...',
      submit: '신고 제출',
      submitting: '제출 중...',
      success: {
        title: '감사합니다!',
        message: '여러분의 신고는 Rumi AI 개선에 도움이 됩니다.',
        close: '닫기',
      },
      error: {
        title: '문제가 발생했습니다',
        message: '신고를 제출할 수 없습니다. 다시 시도해 주세요.',
        retry: '다시 시도',
      },
    },
  };

  const c = content[language] || content.en;

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
    setIsSubmitting(true);
    setSubmitError(false);

    try {
      // Build payload: message-specific (message_id) or session-linked (chat_session_id)
      // Only send message_id if it's a valid UUID; otherwise use session_id for backend to resolve latest
      const payload: Record<string, string> = {
        type: category,
        message: description.trim(),
      };
      if (messageId && UUID_REGEX.test(messageId)) {
        payload.message_id = messageId;
      }
      if (sessionId && UUID_REGEX.test(sessionId)) {
        payload.chat_session_id = sessionId;
      }

      const resp = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!resp.ok) {
        console.error('[Report] Submit failed:', resp.status);
        setSubmitError(true);
        return;
      }

      setSubmitted(true);
    } catch (error) {
      console.error('[Report] Network error:', error);
      setSubmitError(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setSubmitted(false);
    setSubmitError(false);
    setDescription('');
    setCategory('incorrect');
    onClose();
  };

  const handleRetry = () => {
    setSubmitError(false);
  };

  if (!isOpen) return null;

  const categories: { value: ReportCategory; label: string }[] = [
    { value: 'incorrect', label: c.categories.incorrect },
    { value: 'offensive', label: c.categories.offensive },
    { value: 'ocr_error', label: c.categories.ocr_error },
    { value: 'other', label: c.categories.other },
  ];

  return (
    <div
      className="modal-overlay"
      dir={direction}
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="report-modal-title"
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
              id="report-modal-title"
              className="modal-title"
            >
              {c.title}
            </h2>
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
          {submitted ? (
            <div className="modal-success">
              <div className="modal-success-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
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
              {/* Issue Type */}
              <div>
                <label>{c.issueTypeLabel}</label>
                <div className="feedback-category">
                  {categories.map((cat) => (
                    <button
                      key={cat.value}
                      type="button"
                      onClick={() => setCategory(cat.value)}
                      className={`category-btn ${category === cat.value ? 'active' : ''}`}
                      style={category === cat.value ? {
                        borderColor: 'var(--accent-teal)',
                        background: 'var(--accent-teal-light)',
                        color: 'var(--accent-teal)',
                      } : undefined}
                      aria-pressed={category === cat.value}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div>
                <label htmlFor="report-description">{c.descriptionLabel}</label>
                <textarea
                  id="report-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="feedback-textarea"
                  placeholder={c.descriptionPlaceholder}
                  required
                />
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isSubmitting || !description.trim()}
                className="feedback-submit"
              >
                {isSubmitting ? c.submitting : c.submit}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
