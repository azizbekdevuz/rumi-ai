'use client';

import { useState, useEffect, useRef } from 'react';
import { useI18n } from '@/lib/i18n/i18n-context';
import { X } from 'lucide-react';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  messageId?: string;
}

type ReportCategory = 'incorrect' | 'offensive' | 'ocr_error' | 'other';

export default function ReportModal({ isOpen, onClose, messageId }: ReportModalProps) {
  const { dir } = useI18n();
  const direction = dir;
  const [category, setCategory] = useState<ReportCategory>('incorrect');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const firstFocusableRef = useRef<HTMLButtonElement>(null);

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

    // Mock submission - replace with actual API call
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('Report submitted:', {
        messageId,
        category,
        description,
      });

      setSubmitted(true);
      setTimeout(() => {
        handleClose();
      }, 2000);
    } catch (error) {
      console.error('Failed to submit report:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setSubmitted(false);
    setDescription('');
    setCategory('incorrect');
    onClose();
  };

  if (!isOpen) return null;

  const categories: { value: ReportCategory; label: string }[] = [
    { value: 'incorrect', label: 'Incorrect Information' },
    { value: 'offensive', label: 'Inappropriate Content' },
    { value: 'ocr_error', label: 'OCR/Text Error' },
    { value: 'other', label: 'Other' },
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
              Report Issue
            </h2>
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
          {submitted ? (
            <div className="text-center py-10">
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>✓</div>
              <h3 
                className="text-2xl font-serif font-bold mb-4"
                style={{ color: 'var(--text-primary)' }}
              >
                Thank you for your feedback!
              </h3>
              <p 
                className="mb-8 text-base leading-relaxed max-w-sm mx-auto"
                style={{ color: 'var(--text-secondary)' }}
              >
                Your report helps us improve Rumi AI.
              </p>
              <button
                onClick={handleClose}
                className="py-4 px-8 rounded-[var(--radius-lg)] font-semibold transition-all hover:shadow-lg"
                style={{
                  background: 'var(--gradient-teal)',
                  color: 'var(--text-inverse)'
                }}
              >
                Close
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="feedback-form">
              {/* Issue Type */}
              <div>
                <label 
                  className="block text-sm font-semibold mb-3"
                  style={{ color: 'var(--text-primary)' }}
                >
                  What type of issue is this?
                </label>
                <div className="feedback-category">
                  {categories.map((cat) => (
                    <button
                      key={cat.value}
                      type="button"
                      onClick={() => setCategory(cat.value)}
                      className="category-btn"
                      style={{
                        borderColor: category === cat.value ? 'var(--accent-teal)' : 'var(--border-color)',
                        background: category === cat.value ? 'var(--accent-teal-light)' : 'var(--bg-secondary)',
                        color: category === cat.value ? 'var(--accent-teal)' : 'var(--text-secondary)'
                      }}
                      aria-pressed={category === cat.value}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div>
                <label 
                  htmlFor="report-description"
                  className="block text-sm font-semibold mb-3"
                  style={{ color: 'var(--text-primary)' }}
                >
                  Please describe the issue
                </label>
                <textarea
                  id="report-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="feedback-textarea"
                  placeholder="Describe what's wrong with this response..."
                  required
                />
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isSubmitting || !description.trim()}
                className="feedback-submit flex items-center justify-center gap-3"
                style={{
                  opacity: (isSubmitting || !description.trim()) ? 0.6 : 1,
                  cursor: (isSubmitting || !description.trim()) ? 'not-allowed' : 'pointer'
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
                    Submitting...
                  </>
                ) : (
                  'Submit Report'
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
