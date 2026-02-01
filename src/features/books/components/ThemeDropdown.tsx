'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Filter } from 'lucide-react';
import { useReducedMotion } from '@/lib/hooks';
import { motion as motionTokens } from '@/lib/design-system/motion';

export type Theme = 'all' | 'love' | 'spirituality' | 'wisdom' | 'mysticism' | 'divine';

const themes: { value: Theme; label: string }[] = [
  { value: 'all', label: 'All Themes' },
  { value: 'love', label: 'Divine Love' },
  { value: 'spirituality', label: 'Spirituality' },
  { value: 'wisdom', label: 'Wisdom' },
  { value: 'mysticism', label: 'Mysticism' },
  { value: 'divine', label: 'Divine Union' },
];

interface ThemeDropdownProps {
  selectedTheme: Theme;
  onThemeChange: (theme: Theme) => void;
}

export default function ThemeDropdown({
  selectedTheme,
  onThemeChange,
}: ThemeDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedThemeLabel = themes.find((t) => t.value === selectedTheme)?.label || 'Browse by Theme';

  const dropdownVariants = reducedMotion
    ? motionTokens.variants.reducedMotion
    : motionTokens.variants.scaleDown;

  return (
    <div className="books-theme-dropdown" ref={dropdownRef}>
      <button
        className="books-theme-button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label="Browse by theme"
      >
        <Filter className="books-theme-icon" aria-hidden="true" />
        <span>{selectedThemeLabel}</span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="books-theme-chevron" aria-hidden="true" />
        </motion.div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.ul
            className="books-theme-menu"
            role="listbox"
            variants={dropdownVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            {themes.map((theme) => {
              const isSelected = selectedTheme === theme.value;
              return (
                <li 
                  key={theme.value} 
                  role="option"
                  aria-selected={isSelected}
                >
                  <button
                    className={`books-theme-option ${isSelected ? 'active' : ''}`}
                    onClick={() => {
                      onThemeChange(theme.value);
                      setIsOpen(false);
                    }}
                  >
                    {theme.label}
                  </button>
                </li>
              );
            })}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
