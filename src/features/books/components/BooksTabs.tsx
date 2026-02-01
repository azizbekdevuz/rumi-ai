'use client';

import { motion } from 'framer-motion';
import { useReducedMotion } from '@/lib/hooks';

export type BookTab = 'all' | 'masnavi' | 'divan-e-shams' | 'fihi-ma-fihi';

const tabs: { value: BookTab; label: string }[] = [
  { value: 'all', label: 'All Books' },
  { value: 'masnavi', label: 'Masnavi' },
  { value: 'divan-e-shams', label: 'Divan-e Shams' },
  { value: 'fihi-ma-fihi', label: 'Fihi Ma Fihi' },
];

interface BooksTabsProps {
  activeTab: BookTab;
  onTabChange: (tab: BookTab) => void;
}

export default function BooksTabs({ activeTab, onTabChange }: BooksTabsProps) {
  const reducedMotion = useReducedMotion();

  return (
    <div className="books-tabs" role="tablist" aria-label="Book categories">
      {tabs.map((tab, index) => {
        const isActive = tab.value === activeTab;
        return (
          <button
            key={tab.value}
            role="tab"
            aria-selected={isActive}
            aria-controls={`tabpanel-${tab.value}`}
            className={`books-tab ${isActive ? 'active' : ''}`}
            onClick={() => onTabChange(tab.value)}
            onKeyDown={(e) => {
              // Keyboard navigation
              if (e.key === 'ArrowRight' && index < tabs.length - 1) {
                onTabChange(tabs[index + 1].value);
              } else if (e.key === 'ArrowLeft' && index > 0) {
                onTabChange(tabs[index - 1].value);
              }
            }}
          >
            {tab.label}
            {isActive && (
              <motion.div
                className="books-tab-indicator"
                layoutId="activeTab"
                initial={reducedMotion ? false : {}}
                transition={{
                  type: 'spring',
                  stiffness: 300,
                  damping: 30,
                }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
