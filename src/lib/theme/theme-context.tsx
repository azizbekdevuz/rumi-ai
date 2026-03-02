'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  mounted: boolean;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  // Always start with 'light' for consistent server/client first render.
  // The blocking <script> in layout.tsx handles the visual theme before paint
  // so users never see a flash, but React state stays consistent until useEffect.
  const [theme, setThemeState] = useState<Theme>('light');
  const [mounted, setMounted] = useState(false);

  // Sync React state with localStorage after hydration
  useEffect(() => {
    let stored: Theme | null = null;
    try {
      stored = localStorage.getItem('rumi-theme') as Theme | null;
    } catch {
      // localStorage unavailable (private browsing, storage disabled, etc.)
    }
    // Use requestAnimationFrame to avoid synchronous setState in effect
    requestAnimationFrame(() => {
      if (stored && ['light', 'dark'].includes(stored)) {
        setThemeState(stored);
        document.documentElement.setAttribute('data-theme', stored);
      }
      setMounted(true);
    });
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    applyTheme(newTheme);
  };

  const applyTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem('rumi-theme', newTheme);
    } catch {
      // localStorage unavailable; state and DOM attribute are still updated
    }
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, mounted, toggleTheme, setTheme: applyTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}