'use client';

import { useRef, useEffect } from 'react';
import { Citation } from '../../../types/chat';
import Link from 'next/link';
import { CloseIcon, ExternalLinkIcon } from '@/components/ui/icons';

interface CitationModalProps {
  citation: Citation | null;
  onClose: () => void;
}

export default function CitationModal({ citation, onClose }: CitationModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Focus trap and keyboard handling
  useEffect(() => {
    if (citation) {
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
  }, [citation, onClose]);

  if (!citation) return null;

  // Generate URL-safe book ID
  const bookId = citation.book.toLowerCase().replace(/[^a-z0-9]+/g, '-');

  return (
    <div 
      className="modal-overlay" 
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="citation-modal-title"
    >
      <div 
        ref={modalRef}
        className="modal-content citation-modal" 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h3 id="citation-modal-title" className="modal-title">Citation Details</h3>
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
          <dl>
            <div className="citation-detail">
              <dt className="citation-detail-label">Book:</dt>
              <dd className="citation-detail-value">{citation.book}</dd>
            </div>

            <div className="citation-detail">
              <dt className="citation-detail-label">Page:</dt>
              <dd className="citation-detail-value">{citation.page}</dd>
            </div>
          </dl>

          <div className="citation-snippet">
            <span className="citation-detail-label">Excerpt:</span>
            <blockquote className="citation-snippet-text">
              {citation.snippet}
            </blockquote>
          </div>

          <Link
            href={`/books/${bookId}?page=${citation.page}&ref=${citation.refId}`}
            className="citation-cta"
            onClick={onClose}
          >
            Read in Library
            <ExternalLinkIcon style={{ width: 16, height: 16 }} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </div>
  );
}
