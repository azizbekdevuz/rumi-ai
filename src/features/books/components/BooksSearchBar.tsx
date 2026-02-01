'use client';

import { SearchIcon } from '@/components/ui/icons';
import { ChevronDown } from 'lucide-react';

interface BooksSearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function BooksSearchBar({
  value,
  onChange,
  placeholder = "Search Rumi's poetry…",
}: BooksSearchBarProps) {
  return (
    <div className="books-search-bar">
      <SearchIcon className="books-search-icon" aria-hidden="true" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="books-search-input"
        aria-label="Search books and verses"
      />
      {/* Right side dropdown chevron area with divider */}
      <div className="books-search-dropdown-area">
        <div className="books-search-divider" aria-hidden="true" />
        <button
          type="button"
          className="books-search-dropdown-trigger"
          aria-label="Search filters"
        >
          <ChevronDown className="books-search-dropdown-icon" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
