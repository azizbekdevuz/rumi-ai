'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import type { AuthMeResponse, AuthStatus, AuthUser } from '@/types/auth';

// ── Context shape ───────────────────────────────────────────────────

interface AuthContextValue {
  /** Current user (null when loading or unauthenticated) */
  user: AuthUser | null;
  /** Current auth lifecycle state */
  status: AuthStatus;
  /** Re-fetch user from backend (call after login / signup) */
  refresh: () => Promise<void>;
  /** Clear session cookie and reset state (call for logout) */
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// ── Provider ────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [status, setStatus] = useState<AuthStatus>('loading');

  const refresh = useCallback(async () => {
    try {
      const resp = await fetch('/api/auth/me');
      const data: AuthMeResponse = await resp.json();

      if (data.authenticated && data.user) {
        setUser(data.user);
        setStatus('authenticated');
      } else {
        setUser(null);
        setStatus('unauthenticated');
      }
    } catch {
      setUser(null);
      setStatus('unauthenticated');
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } finally {
      setUser(null);
      setStatus('unauthenticated');
    }
  }, []);

  // Fetch auth state once on mount
  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <AuthContext.Provider value={{ user, status, refresh, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// ── Hook ────────────────────────────────────────────────────────────

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within <AuthProvider>');
  }
  return ctx;
}
