'use client';

import { useState, useRef, useEffect } from 'react';
import { CloseIcon } from '@/components/ui/icons';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  messageId?: string;
}

type ReportCategory = 'incorrect' | 'offensive' | 'ocr_error' | 'other';

export default function ReportModal({ isOpen, onClose, messageId }: ReportModalProps) {
  const [category, setCategory] = useState<ReportCategory>('incorrect');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Focus trap and keyboard handling
  useEffect(() => {
    if (isOpen) {
      closeButtonRef.current?.focus();
      
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose();
        }
        
        // Focus trap
        if (e.key === 'Tab' && modalRef.current) {
          const focusableElements = modalRef.current.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
          const firstElement = focusableElements[0] as HTMLElement;
          const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

          if (e.shiftKey && document.activeElement === firstElement) {
            e.preventDefault();
            lastElement?.focus();
          } else if (!e.shiftKey && document.activeElement === lastElement) {
            e.preventDefault();
            firstElement?.focus();
          }
        }
      };

      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';

      return () => {
        document.removeEventListener('keydown', handleKeyDown);
        document.body.style.overflow = '';
      };
    }
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
        onClose();
        setSubmitted(false);
        setCategory('incorrect');
        setDescription('');
      }, 2000);
    } catch (error) {
      console.error('Failed to submit report:', error);
    } finally {
      setIsSubmitting(false);
    }
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
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="report-modal-title"
    >
      <div 
        ref={modalRef}
        className="modal-content" 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h3 id="report-modal-title" className="modal-title">
            Report Issue
          </h3>
          <button 
            ref={closeButtonRef}
            className="modal-close" 
            onClick={onClose} 
            aria-label="Close modal"
          >
            <CloseIcon />
          </button>
        </div>

        <div className="modal-body">
          {submitted ? (
            <div style={{ textAlign: 'center', padding: '24px' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>✓</div>
              <p style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>
                Thank you for your feedback!
              </p>
              <p style={{ color: 'var(--text-secondary)' }}>
                Your report helps us improve Rumi AI.
              </p>
            </div>
          ) : (
            <form className="feedback-form" onSubmit={handleSubmit}>
              <div>
                <label 
                  style={{ 
                    display: 'block', 
                    marginBottom: '8px',
                    fontWeight: 500,
                    fontSize: '14px',
                  }}
                >
                  What type of issue is this?
                </label>
                <div className="feedback-category">
                  {categories.map((cat) => (
                    <button
                      key={cat.value}
                      type="button"
                      className={`category-btn ${category === cat.value ? 'active' : ''}`}
                      onClick={() => setCategory(cat.value)}
                      aria-pressed={category === cat.value}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label 
                  htmlFor="report-description"
                  style={{ 
                    display: 'block', 
                    marginBottom: '8px',
                    fontWeight: 500,
                    fontSize: '14px',
                  }}
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

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button
                  type="button"
                  onClick={onClose}
                  style={{
                    padding: '10px 20px',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    fontWeight: 500,
                  }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="feedback-submit"
                  disabled={isSubmitting || !description.trim()}
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Report'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
