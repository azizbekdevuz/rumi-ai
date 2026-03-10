import { describe, it, expect } from 'vitest';

/**
 * CitationChip format logic: `${citation.book} : Page ${citation.page ?? 'N/A'}`
 * Tests the same behavior as the component (page 0 vs N/A for missing).
 */
function formatCitation(citation: { book: string; page?: number | null }): string {
  return `${citation.book} : Page ${citation.page ?? 'N/A'}`;
}

describe('CitationChip format logic', () => {
  it('shows Page 0 correctly (not N/A)', () => {
    expect(formatCitation({ book: 'Masnavi', page: 0 })).toBe('Masnavi : Page 0');
  });

  it('shows N/A for missing/undefined page', () => {
    expect(formatCitation({ book: 'Masnavi', page: undefined })).toBe('Masnavi : Page N/A');
    expect(formatCitation({ book: 'Masnavi', page: null })).toBe('Masnavi : Page N/A');
  });

  it('shows page number when present', () => {
    expect(formatCitation({ book: 'Masnavi', page: 42 })).toBe('Masnavi : Page 42');
  });
});
