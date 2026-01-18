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
      <main 
        className="min-h-screen flex items-center justify-center py-12 px-4" 
        dir={direction}
        style={{ background: 'var(--bg-primary)' }}
      >
        <div className="text-center">
          <BookOpen 
            className="w-16 h-16 mx-auto mb-4" 
            style={{ color: 'var(--text-muted)' }} 
          />
          <h1 
            className="text-2xl font-serif font-bold mb-4"
            style={{ color: 'var(--text-primary)' }}
          >
            {c.notFound}
          </h1>
          <Link
            href="/books"
            className="inline-flex items-center gap-2 hover:underline"
            style={{ color: 'var(--accent-teal)' }}
          >
            <BackArrow className="w-5 h-5" />
            {c.goBack}
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main 
      className="min-h-screen flex flex-col" 
      dir={direction}
      style={{ background: 'var(--bg-primary)' }}
    >
      {/* Top Toolbar */}
      <header 
        className="sticky top-0 z-40"
        style={{ 
          background: 'var(--bg-tertiary)', 
          borderBottom: '2px solid var(--border-color)',
          boxShadow: 'var(--shadow-sm)'
        }}
      >
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between gap-6">
            {/* Back & Title */}
            <div className="flex items-center gap-5 min-w-0">
              <Link
                href="/books"
                className="flex items-center gap-2 transition-colors py-2 px-3 rounded-lg hover:bg-[var(--bg-secondary)]"
                style={{ color: 'var(--text-secondary)' }}
              >
                <BackArrow className="w-5 h-5" />
                <span className="hidden sm:inline font-medium">{c.back}</span>
              </Link>
              <div 
                className="h-8 w-px hidden sm:block"
                style={{ background: 'var(--border-color)' }}
              />
              <h1 
                className="text-xl font-serif font-semibold truncate"
                style={{ color: 'var(--text-primary)' }}
              >
                {getBookTitle(book)}
              </h1>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowToc(!showToc)}
                className="p-3 rounded-lg transition-colors"
                style={{ 
                  background: showToc ? 'var(--accent-teal-light)' : 'var(--bg-secondary)',
                  border: showToc ? '1px solid var(--accent-teal)' : '1px solid var(--border-color)'
                }}
                aria-label={c.toc}
                title={c.toc}
              >
                <List 
                  className="w-5 h-5" 
                  style={{ color: showToc ? 'var(--accent-teal)' : 'var(--text-secondary)' }} 
                />
              </button>
              <button
                className="p-3 rounded-lg transition-colors"
                style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}
                aria-label={c.bookmark}
                title={c.bookmark}
              >
                <BookMarked className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} />
              </button>
              <button
                className="p-3 rounded-lg transition-colors hidden sm:flex"
                style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}
                aria-label={c.share}
                title={c.share}
              >
                <Share2 className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} />
              </button>
              <button
                className="p-3 rounded-lg transition-colors hidden sm:flex"
                style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}
                aria-label={c.download}
                title={c.download}
              >
                <Download className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Table of Contents Sidebar */}
        {showToc && (
          <aside 
            className="w-72 overflow-y-auto"
            style={{ 
              background: 'var(--bg-tertiary)', 
              borderInlineEnd: '2px solid var(--border-color)' 
            }}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 
                  className="font-semibold text-lg"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {c.toc}
                </h2>
                <button
                  onClick={() => setShowToc(false)}
                  className="p-2 rounded-lg transition-colors lg:hidden"
                  style={{ background: 'var(--bg-secondary)' }}
                >
                  <X className="w-5 h-5" style={{ color: 'var(--text-muted)' }} />
                </button>
              </div>
              <nav className="space-y-2">
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
                      className="w-full text-start px-4 py-3 rounded-lg transition-all"
                      style={{
                        background: isActive ? 'var(--accent-teal-light)' : 'transparent',
                        color: isActive ? 'var(--accent-teal)' : 'var(--text-secondary)',
                        border: isActive ? '1px solid var(--accent-teal)' : '1px solid transparent',
                        fontWeight: isActive ? 600 : 400
                      }}
                    >
                      <span className="block truncate text-base">{item.title}</span>
                      <span 
                        className="text-sm mt-1 block"
                        style={{ color: isActive ? 'var(--accent-teal)' : 'var(--text-muted)', opacity: 0.8 }}
                      >
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
        <div className="flex-1 flex flex-col">
          {/* Citation Highlight Banner */}
          {highlightText && (
            <div 
              className="px-4 py-2"
              style={{ 
                background: 'var(--accent-gold-light)', 
                borderBottom: '1px solid rgba(201, 146, 44, 0.2)' 
              }}
            >
              <p className="text-sm" style={{ color: 'var(--accent-gold)' }}>
                <span className="font-medium">{c.citationHighlight}:</span>{' '}
                <span className="italic">&ldquo;{highlightText}&rdquo;</span>
              </p>
            </div>
          )}

          {/* PDF Display */}
          <div 
            className="flex-1 overflow-auto p-4 lg:p-8 flex items-center justify-center"
            style={{ background: 'var(--bg-secondary)' }}
          >
            <div
              className="bg-white rounded-lg overflow-hidden"
              style={{
                width: `${(600 * zoom) / 100}px`,
                height: `${(800 * zoom) / 100}px`,
                maxWidth: '90vw',
                maxHeight: '80vh',
                boxShadow: 'var(--shadow-xl)'
              }}
            >
              {/* PDF Skeleton/Placeholder */}
              <div 
                className="w-full h-full flex flex-col items-center justify-center p-8"
                style={{ background: '#faf9f6' }}
              >
                <BookOpen 
                  className="w-16 h-16 mb-4" 
                  style={{ color: 'var(--text-muted)', opacity: 0.3 }} 
                />
                <p 
                  className="text-center mb-2"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {c.pdfPlaceholder}
                </p>
                <p 
                  className="text-sm text-center"
                  style={{ color: 'var(--text-muted)', opacity: 0.6 }}
                >
                  {c.page} {currentPage} {c.of} {totalPages}
                </p>
                {/* Mock content preview */}
                <div className="mt-8 w-full max-w-md space-y-3">
                  {[75, 100, 85, 66, 80, 100, 75].map((width, i) => (
                    <div 
                      key={i}
                      className="h-4 rounded"
                      style={{ 
                        background: 'var(--text-muted)', 
                        opacity: 0.1,
                        width: `${width}%`
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Toolbar */}
          <div 
            className="px-6 py-4"
            style={{ 
              background: 'var(--bg-tertiary)', 
              borderTop: '2px solid var(--border-color)' 
            }}
          >
            <div className="flex items-center justify-between max-w-3xl mx-auto">
              {/* Page Navigation */}
              <div className="flex items-center gap-3">
                <button
                  onClick={handlePrevPage}
                  disabled={currentPage <= 1}
                  className="p-3 rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ 
                    background: 'var(--bg-secondary)', 
                    border: '1px solid var(--border-color)' 
                  }}
                  aria-label="Previous page"
                >
                  <PrevIcon className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} />
                </button>

                <div 
                  className="flex items-center gap-3 text-base"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  <input
                    type="number"
                    value={currentPage}
                    onChange={(e) => {
                      const page = parseInt(e.target.value);
                      if (page >= 1 && page <= totalPages) {
                        setCurrentPage(page);
                      }
                    }}
                    className="w-16 px-3 py-2 text-center rounded-lg font-medium"
                    style={{
                      border: '2px solid var(--border-color)',
                      background: 'var(--bg-primary)',
                      color: 'var(--text-primary)'
                    }}
                    min={1}
                    max={totalPages}
                  />
                  <span className="font-medium">
                    {c.of} {totalPages}
                  </span>
                </div>

                <button
                  onClick={handleNextPage}
                  disabled={currentPage >= totalPages}
                  className="p-3 rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ 
                    background: 'var(--bg-secondary)', 
                    border: '1px solid var(--border-color)' 
                  }}
                  aria-label="Next page"
                >
                  <NextIcon className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} />
                </button>
              </div>

              {/* Zoom Controls */}
              <div className="flex items-center gap-3">
                <button
                  onClick={handleZoomOut}
                  disabled={zoom <= 50}
                  className="p-3 rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ 
                    background: 'var(--bg-secondary)', 
                    border: '1px solid var(--border-color)' 
                  }}
                  aria-label="Zoom out"
                >
                  <ZoomOut className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} />
                </button>

                <span 
                  className="text-base w-14 text-center font-medium"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {zoom}%
                </span>

                <button
                  onClick={handleZoomIn}
                  disabled={zoom >= 200}
                  className="p-3 rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ 
                    background: 'var(--bg-secondary)', 
                    border: '1px solid var(--border-color)' 
                  }}
                  aria-label="Zoom in"
                >
                  <ZoomIn className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} />
                </button>

                <button
                  onClick={toggleFullscreen}
                  className="p-3 rounded-lg transition-colors hidden sm:flex"
                  style={{ 
                    background: 'var(--bg-secondary)', 
                    border: '1px solid var(--border-color)' 
                  }}
                  aria-label="Toggle fullscreen"
                >
                  <Maximize className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
