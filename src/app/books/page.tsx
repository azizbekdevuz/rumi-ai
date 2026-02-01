'use client';

import { useState, useMemo } from 'react';
import { useI18n } from '@/lib/i18n/i18n-context';
import { books, searchBooks } from '@/lib/data/books';
import { sampleVerses } from '@/lib/data/verses';
import BooksPageShell from '@/features/books/components/BooksPageShell';
import BooksPanel from '@/features/books/components/BooksPanel';
import BooksSearchBar from '@/features/books/components/BooksSearchBar';
import ThemeDropdown, { Theme } from '@/features/books/components/ThemeDropdown';
import BooksTabs, { BookTab } from '@/features/books/components/BooksTabs';
import BookCard from '@/features/books/components/BookCard';
import VerseCarousel from '@/features/books/components/VerseCarousel';
import Link from 'next/link';

export default function BooksPage() {
  const { language } = useI18n();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<BookTab>('all');
  const [selectedTheme, setSelectedTheme] = useState<Theme>('all');

  // Filter books based on tab
  const filteredBooks = useMemo(() => {
    let result = books;

    // Filter by tab
    if (activeTab !== 'all') {
      const tabIdMap: Record<BookTab, string> = {
        'all': 'all',
        'masnavi': 'masnavi',
        'divan-e-shams': 'divan-e-shams',
        'fihi-ma-fihi': 'fihi-ma-fihi',
      };
      result = result.filter((book) => book.id === tabIdMap[activeTab]);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      result = searchBooks(searchQuery, activeTab === 'all' ? undefined : activeTab);
    }

    return result;
  }, [activeTab, searchQuery]);

  // Filter verses based on search and theme (for carousel)
  const filteredVerses = useMemo(() => {
    let result = sampleVerses;

    // Filter by search query
    if (searchQuery.trim()) {
      const lowerQuery = searchQuery.toLowerCase();
      result = result.filter(
        (verse) =>
          verse.fa.includes(searchQuery) ||
          verse.en.toLowerCase().includes(lowerQuery) ||
          verse.book.toLowerCase().includes(lowerQuery)
      );
    }

    // Theme filtering (simplified - in real app would use verse metadata)
    // For now, just return all verses if theme is 'all', otherwise filter by book
    if (selectedTheme !== 'all') {
      // This is a placeholder - real implementation would use verse theme tags
      result = result;
    }

    return result;
  }, [searchQuery, selectedTheme]);

  return (
    <BooksPageShell>
      <BooksPanel>
        {/* Search + Filters Row */}
        <div className="books-controls-row">
          <BooksSearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search Rumi's poetry…"
          />
          <ThemeDropdown
            selectedTheme={selectedTheme}
            onThemeChange={setSelectedTheme}
          />
        </div>

        {/* Tabs Row */}
        <BooksTabs activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Book Card Grid */}
        <div className="books-grid-container">
          {filteredBooks.length === 0 ? (
            <div className="books-empty-state">
              <div className="books-empty-icon">📚</div>
              <h3 className="books-empty-title">No books found</h3>
              <p className="books-empty-text">Try adjusting your search or filter.</p>
            </div>
          ) : (
            <div className="books-grid">
              {filteredBooks.map((book) => (
                <BookCard key={book.id} book={book} language={language} />
              ))}
            </div>
          )}
        </div>

        {/* Timeless Poetry Section */}
        {filteredVerses.length > 0 && (
          <VerseCarousel verses={filteredVerses} language={language} />
        )}

        {/* Footer Links */}
        <div className="books-footer-links">
          <Link href="/privacy" className="books-footer-link">
            Privacy Policy
          </Link>
          <span className="books-footer-separator">|</span>
          <Link href="/contact" className="books-footer-link">
            Contact Us
          </Link>
        </div>
      </BooksPanel>
    </BooksPageShell>
  );
}
