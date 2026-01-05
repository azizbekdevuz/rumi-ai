'use client';

import { useState } from 'react';
import { useI18n } from '@/lib/i18n/i18n-context';
import { books, searchBooks, Book } from '@/lib/data/books';
import Link from 'next/link';

export default function BooksPage() {
  const { t, language } = useI18n();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBook, setSelectedBook] = useState<string>('all');
  const [results, setResults] = useState<Book[]>(books);

  const handleSearch = (query: string, bookFilter: string) => {
    setSearchQuery(query);
    setSelectedBook(bookFilter);

    if (!query.trim() && bookFilter === 'all') {
      setResults(books);
    } else {
      setResults(searchBooks(query, bookFilter === 'all' ? undefined : bookFilter));
    }
  };

  const getLocalizedTitle = (book: Book) => {
    if (language === 'fa') return book.titleFa;
    if (language === 'kr') return book.titleKr;
    return book.title;
  };

  const getLocalizedDescription = (book: Book) => {
    if (language === 'fa') return book.descriptionFa;
    if (language === 'kr') return book.descriptionKr;
    return book.description;
  };

  return (
    <div className="books-page">
      <div className="books-container">
        <header className="books-header">
          <h1 className="books-title">Library</h1>
          <p className="books-subtitle">Explore the works of Rumi</p>
        </header>

        {/* Search Section */}
        <div className="books-search">
          <div className="search-input-wrapper">
            <input
              type="text"
              placeholder="Search books, topics, or keywords..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value, selectedBook)}
              className="search-input"
              aria-label="Search books"
            />
            <span className="search-icon">🔍</span>
          </div>

          <div className="book-filter">
            <label htmlFor="book-select" className="filter-label">
              Filter by book:
            </label>
            <select
              id="book-select"
              value={selectedBook}
              onChange={(e) => handleSearch(searchQuery, e.target.value)}
              className="book-select"
            >
              <option value="all">All Books</option>
              {books.map((book) => (
                <option key={book.id} value={book.id}>
                  {getLocalizedTitle(book)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Results */}
        <div className="books-results">
          {results.length === 0 ? (
            <div className="books-empty">
              <div className="empty-icon">📚</div>
              <h3 className="empty-title">No books found</h3>
              <p className="empty-text">Try adjusting your search or filter.</p>
            </div>
          ) : (
            <div className="books-grid">
              {results.map((book) => (
                <Link
                  key={book.id}
                  href={`/books/${book.id}`}
                  className="book-card"
                >
                  <div className="book-icon">{book.icon}</div>
                  <div className="book-info">
                    <h3 className="book-card-title">{getLocalizedTitle(book)}</h3>
                    <p className="book-author">{book.author}</p>
                    <p className="book-description">{getLocalizedDescription(book)}</p>
                    <div className="book-meta">
                      <span className="book-category">{book.category}</span>
                      <span className="book-pages">{book.pages} pages</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Search Results Info */}
        {searchQuery && (
          <div className="search-info">
            Showing {results.length} result{results.length !== 1 ? 's' : ''} for "{searchQuery}"
          </div>
        )}
      </div>
    </div>
  );
}