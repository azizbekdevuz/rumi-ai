/**
 * Auth types — mirrors the backend UserResponse schema.
 * Shared across AuthProvider, Navbar, Profile, and BFF routes.
 */

export interface AuthUser {
  id: string;
  email: string;
  preferred_lang: string | null;
  theme: string | null;
  avatar_url: string | null;
  display_name: string | null;
  created_at: string;
  last_login: string | null;
  is_deleted: boolean;
}

/** Response shape from GET /api/auth/me BFF route */
export interface AuthMeResponse {
  authenticated: boolean;
  user: AuthUser | null;
}

/** Possible states for the auth context */
export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';
