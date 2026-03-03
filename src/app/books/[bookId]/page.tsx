'use client';

import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useI18n } from '@/lib/i18n/i18n-context';
import { books, Book } from '@/lib/data/books';
import {
  ArrowLeft,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  ZoomIn,
  ZoomOut,
  Maximize,
  List,
  X,
  Download,
  Share2,
  BookMarked,
} from 'lucide-react';

export default function BookReaderPage() {
  const { bookId } = useParams();
  const searchParams = useSearchParams();
  const { language, dir } = useI18n();
  const direction = dir;

  const highlightPage = searchParams.get('page');
  const highlightText = searchParams.get('highlight');

  const book = books.find((b) => b.id === bookId);

  // Helper to get localized title
  const getBookTitle = (book: Book) => {
    if (language === 'fa') return book.titleFa;
    if (language === 'kr') return book.titleKr;
    return book.title;
  };
  const [currentPage, setCurrentPage] = useState(highlightPage ? parseInt(highlightPage) : 1);
  const [zoom, setZoom] = useState(100);
  const [showToc, setShowToc] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_isFullscreen, setIsFullscreen] = useState(false);

  const content = {
    en: {
      back: 'Back to Library',
      page: 'Page',
      of: 'of',
      toc: 'Table of Contents',
      download: 'Download',
      share: 'Share',
      bookmark: 'Bookmark',
      notFound: 'Book not found',
      goBack: 'Go back to library',
      loading: 'Loading PDF...',
      pdfPlaceholder: 'PDF viewer will display here',
      citationHighlight: 'Highlighted from citation',
    },
    fa: {
      back: 'بازگشت به کتابخانه',
      page: 'صفحه',
      of: 'از',
      toc: 'فهرست مطالب',
      download: 'دانلود',
      share: 'اشتراک‌گذاری',
      bookmark: 'نشانک',
      notFound: 'کتاب یافت نشد',
      goBack: 'بازگشت به کتابخانه',
      loading: 'در حال بارگذاری PDF...',
      pdfPlaceholder: 'نمایشگر PDF اینجا نمایش داده می‌شود',
      citationHighlight: 'برجسته‌شده از استناد',
    },
    kr: {
      back: '도서관으로 돌아가기',
      page: '페이지',
      of: '/',
      toc: '목차',
      download: '다운로드',
      share: '공유',
      bookmark: '북마크',
      notFound: '책을 찾을 수 없습니다',
      goBack: '도서관으로 돌아가기',
      loading: 'PDF 로딩 중...',
      pdfPlaceholder: 'PDF 뷰어가 여기에 표시됩니다',
      citationHighlight: '인용에서 하이라이트됨',
    },
  };

  const c = content[language] || content.en;

  const BackArrow = direction === 'rtl' ? ArrowRight : ArrowLeft;
  const PrevIcon = direction === 'rtl' ? ChevronRight : ChevronLeft;
  const NextIcon = direction === 'rtl' ? ChevronLeft : ChevronRight;

  // Mock table of contents
  const tocItems = [
    { title: language === 'fa' ? 'مقدمه' : language === 'kr' ? '서론' : 'Introduction', page: 1 },
    { title: language === 'fa' ? 'فصل اول' : language === 'kr' ? '1장' : 'Chapter 1', page: 15 },
    { title: language === 'fa' ? 'فصل دوم' : language === 'kr' ? '2장' : 'Chapter 2', page: 45 },
    { title: language === 'fa' ? 'فصل سوم' : language === 'kr' ? '3장' : 'Chapter 3', page: 78 },
    { title: language === 'fa' ? 'نتیجه‌گیری' : language === 'kr' ? '결론' : 'Conclusion', page: 120 },
  ];

  const totalPages = 150; // Mock total pages

  // Update current page when highlightPage changes (using ref to avoid setState in effect)
  useEffect(() => {
    if (highlightPage) {
      const pageNum = parseInt(highlightPage);
      // Use setTimeout to defer the state update
      const timer = setTimeout(() => {
        setCurrentPage(pageNum);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [highlightPage]);

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handleZoomIn = () => {
    if (zoom < 200) {
      setZoom(zoom + 25);
    }
  };

  const handleZoomOut = () => {
    if (zoom > 50) {
      setZoom(zoom - 25);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  if (!book) {
    return (
      <main className="book-reader-not-found" dir={direction}>
        <div className="book-reader-not-found-content">
          <BookOpen className="book-reader-not-found-icon" />
          <h1 className="book-reader-not-found-title">{c.notFound}</h1>
          <Link href="/books" className="book-reader-not-found-link">
            <BackArrow />
            {c.goBack}
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="book-reader-page" dir={direction}>
      {/* Top Toolbar */}
      <header className="book-reader-header">
        <div className="book-reader-header-content">
          {/* Back & Title */}
          <div className="book-reader-nav">
            <Link href="/books" className="book-reader-back-link">
              <BackArrow />
              <span>{c.back}</span>
            </Link>
            <div className="book-reader-nav-divider" />
            <h1 className="book-reader-title">{getBookTitle(book)}</h1>
          </div>

          {/* Actions */}
          <div className="book-reader-actions">
            <button
              onClick={() => setShowToc(!showToc)}
              className={`book-reader-action-btn ${showToc ? 'active' : ''}`}
              aria-label={c.toc}
              title={c.toc}
            >
              <List />
            </button>
            <button
              className="book-reader-action-btn"
              aria-label={c.bookmark}
              title={c.bookmark}
            >
              <BookMarked />
            </button>
            <button
              className="book-reader-action-btn hidden-sm"
              aria-label={c.share}
              title={c.share}
            >
              <Share2 />
            </button>
            <button
              className="book-reader-action-btn hidden-sm"
              aria-label={c.download}
              title={c.download}
            >
              <Download />
            </button>
          </div>
        </div>
      </header>

      <div className="book-reader-main">
        {/* Table of Contents Sidebar */}
        {showToc && (
          <aside className="book-reader-sidebar">
            <div className="book-reader-sidebar-content">
              <div className="book-reader-sidebar-header">
                <h2 className="book-reader-sidebar-title">{c.toc}</h2>
                <button
                  onClick={() => setShowToc(false)}
                  className="book-reader-sidebar-close hidden-lg"
                  aria-label="Close"
                >
                  <X />
                </button>
              </div>
              <nav className="book-reader-toc-nav">
                {tocItems.map((item, index) => {
                  const isActive = currentPage >= item.page &&
                    (tocItems[index + 1] ? currentPage < tocItems[index + 1].page : true);
                  return (
                    <button
                      key={index}
                      onClick={() => {
                        setCurrentPage(item.page);
                        setShowToc(false);
                      }}
                      className={`book-reader-toc-item ${isActive ? 'active' : ''}`}
                    >
                      <span className="book-reader-toc-item-title">{item.title}</span>
                      <span className="book-reader-toc-item-page">
                        {c.page} {item.page}
                      </span>
                    </button>
                  );
                })}
              </nav>
            </div>
          </aside>
        )}

        {/* PDF Viewer Area */}
        <div className="book-reader-viewer">
          {/* Citation Highlight Banner */}
          {highlightText && (
            <div className="book-reader-citation-banner">
              <p className="book-reader-citation-text">
                <strong>{c.citationHighlight}:</strong>{' '}
                <em>&ldquo;{highlightText}&rdquo;</em>
              </p>
            </div>
          )}

          {/* PDF Display */}
          <div className="book-reader-pdf-container">
            <div
              className="book-reader-pdf-wrapper"
              style={{
                width: `${(600 * zoom) / 100}px`,
                height: `${(800 * zoom) / 100}px`,
              }}
            >
              {/* PDF Skeleton/Placeholder */}
              <div className="book-reader-pdf-placeholder">
                <BookOpen className="book-reader-pdf-icon" />
                <p className="book-reader-pdf-text">{c.pdfPlaceholder}</p>
                <p className="book-reader-pdf-page-info">
                  {c.page} {currentPage} {c.of} {totalPages}
                </p>
                {/* Mock content preview */}
                <div className="book-reader-pdf-skeleton">
                  {[75, 100, 85, 66, 80, 100, 75].map((width, i) => (
                    <div
                      key={i}
                      className="book-reader-pdf-skeleton-line"
                      style={{ width: `${width}%` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Toolbar */}
          <div className="book-reader-footer">
            <div className="book-reader-footer-content">
              {/* Page Navigation */}
              <div className="book-reader-page-nav">
                <button
                  onClick={handlePrevPage}
                  disabled={currentPage <= 1}
                  className="book-reader-nav-btn"
                  aria-label="Previous page"
                >
                  <PrevIcon />
                </button>

                <div className="book-reader-page-input-group">
                  <input
                    type="number"
                    value={currentPage}
                    onChange={(e) => {
                      const page = parseInt(e.target.value);
                      if (page >= 1 && page <= totalPages) {
                        setCurrentPage(page);
                      }
                    }}
                    className="book-reader-page-input"
                    min={1}
                    max={totalPages}
                  />
                  <span className="book-reader-page-total">
                    {c.of} {totalPages}
                  </span>
                </div>

                <button
                  onClick={handleNextPage}
                  disabled={currentPage >= totalPages}
                  className="book-reader-nav-btn"
                  aria-label="Next page"
                >
                  <NextIcon />
                </button>
              </div>

              {/* Zoom Controls */}
              <div className="book-reader-zoom-controls">
                <button
                  onClick={handleZoomOut}
                  disabled={zoom <= 50}
                  className="book-reader-zoom-btn"
                  aria-label="Zoom out"
                >
                  <ZoomOut />
                </button>

                <span className="book-reader-zoom-value">{zoom}%</span>

                <button
                  onClick={handleZoomIn}
                  disabled={zoom >= 200}
                  className="book-reader-zoom-btn"
                  aria-label="Zoom in"
                >
                  <ZoomIn />
                </button>

                <button
                  onClick={toggleFullscreen}
                  className="book-reader-zoom-btn hidden-sm"
                  aria-label="Toggle fullscreen"
                >
                  <Maximize />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
