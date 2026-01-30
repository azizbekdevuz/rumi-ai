/**
 * Rumi AI Material System
 * 
 * Professional material layering system for chat interface.
 * Defines opacity scales, borders, shadows, and surface tokens
 * to create consistent "glass parchment" material feel.
 */

// =============================================================================
// SURFACE OPACITY SCALE
// =============================================================================

export const surfaceOpacity = {
  /** Base surface (main panel) - translucent parchment */
  surface1: 0.35,
  /** Secondary surface (verse card, AI bubble) - more opaque, reads as inside content */
  surface2: 0.55,
  /** Tertiary surface (user bubble, buttons) - most opaque */
  surface3: 0.75,
  /** Overlay surfaces (modals, dropdowns) */
  overlay: 0.95,
} as const;

// =============================================================================
// BORDER TOKENS
// =============================================================================

export const borders = {
  /** Primary translucent border - warm, subtle */
  primary: 'rgba(45, 42, 36, 0.12)',
  /** Secondary border - lighter variant */
  secondary: 'rgba(45, 42, 36, 0.08)',
  /** Accent border - teal for interactive elements */
  accent: 'rgba(27, 123, 107, 0.2)',
  /** Gold border - for user elements */
  gold: 'rgba(212, 168, 75, 0.25)',
  /** Dark theme borders */
  dark: {
    primary: 'rgba(232, 228, 220, 0.1)',
    secondary: 'rgba(232, 228, 220, 0.06)',
    accent: 'rgba(77, 196, 180, 0.15)',
    gold: 'rgba(232, 188, 92, 0.2)',
  },
} as const;

// =============================================================================
// SHADOW TOKENS
// =============================================================================

export const materialShadows = {
  /** Outer shadow - large, diffused, not harsh */
  outer: {
    panel: '0 8px 32px rgba(45, 42, 36, 0.12), 0 16px 64px rgba(45, 42, 36, 0.08)',
    card: '0 4px 16px rgba(45, 42, 36, 0.1), 0 8px 32px rgba(45, 42, 36, 0.06)',
    bubble: '0 2px 8px rgba(45, 42, 36, 0.08), 0 4px 16px rgba(45, 42, 36, 0.04)',
  },
  /** Inner shadow - very soft inset for depth */
  inner: {
    panel: 'inset 0 1px 2px rgba(255, 255, 255, 0.4), inset 0 -1px 2px rgba(0, 0, 0, 0.06)',
    card: 'inset 0 1px 1px rgba(255, 255, 255, 0.3), inset 0 -1px 1px rgba(0, 0, 0, 0.05)',
    verse: 'inset 0 2px 4px rgba(0, 0, 0, 0.08), inset 0 -1px 2px rgba(255, 255, 255, 0.2)',
  },
  /** Inner highlight - top edge soft highlight */
  highlight: {
    top: 'inset 0 1px 0 rgba(255, 255, 255, 0.5)',
    topStrong: 'inset 0 2px 4px rgba(255, 255, 255, 0.4)',
  },
  /** Dark theme shadows */
  dark: {
    outer: {
      panel: '0 8px 32px rgba(0, 0, 0, 0.3), 0 16px 64px rgba(0, 0, 0, 0.2)',
      card: '0 4px 16px rgba(0, 0, 0, 0.25), 0 8px 32px rgba(0, 0, 0, 0.15)',
      bubble: '0 2px 8px rgba(0, 0, 0, 0.2), 0 4px 16px rgba(0, 0, 0, 0.1)',
    },
    inner: {
      panel: 'inset 0 1px 2px rgba(255, 255, 255, 0.05), inset 0 -1px 2px rgba(0, 0, 0, 0.2)',
      card: 'inset 0 1px 1px rgba(255, 255, 255, 0.03), inset 0 -1px 1px rgba(0, 0, 0, 0.15)',
      verse: 'inset 0 2px 4px rgba(0, 0, 0, 0.2), inset 0 -1px 2px rgba(255, 255, 255, 0.05)',
    },
    highlight: {
      top: 'inset 0 1px 0 rgba(255, 255, 255, 0.08)',
      topStrong: 'inset 0 2px 4px rgba(255, 255, 255, 0.06)',
    },
  },
} as const;

// =============================================================================
// BACKGROUND COLORS (PARCHMENT)
// =============================================================================

export const parchmentColors = {
  light: {
    base: '#F8F5ED',
    warm: '#F5F0E5',
    cream: '#FAF7F0',
    aged: '#EDE5D5',
  },
  dark: {
    base: '#1A1F2E',
    warm: '#242B3D',
    cream: '#2E364A',
    aged: '#363F56',
  },
} as const;

// =============================================================================
// MATERIAL UTILITIES
// =============================================================================

/**
 * Get material background with opacity
 */
export function getMaterialBackground(
  surface: keyof typeof surfaceOpacity,
  theme: 'light' | 'dark' = 'light'
): string {
  const opacity = surfaceOpacity[surface];
  const baseColor = theme === 'light' ? parchmentColors.light.base : parchmentColors.dark.base;
  
  // Convert hex to rgba
  const r = parseInt(baseColor.slice(1, 3), 16);
  const g = parseInt(baseColor.slice(3, 5), 16);
  const b = parseInt(baseColor.slice(5, 7), 16);
  
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

/**
 * Get material border
 */
export function getMaterialBorder(
  variant: keyof typeof borders = 'primary',
  theme: 'light' | 'dark' = 'light'
): string {
  if (theme === 'dark' && variant !== 'dark' && variant in borders.dark) {
    return borders.dark[variant as keyof typeof borders.dark];
  }
  if (variant === 'dark') {
    return borders.primary; // Fallback for invalid variant
  }
  return borders[variant] as string;
}

/**
 * Get material shadows
 */
export function getMaterialShadows(
  type: 'outer' | 'inner' | 'highlight',
  element: 'panel' | 'card' | 'bubble' | 'verse' = 'panel',
  theme: 'light' | 'dark' = 'light'
): string {
  const shadows = theme === 'dark' ? materialShadows.dark : materialShadows;
  
  if (type === 'outer') {
    return shadows.outer[element as keyof typeof shadows.outer] || shadows.outer.panel;
  }
  if (type === 'inner') {
    return shadows.inner[element as keyof typeof shadows.inner] || shadows.inner.panel;
  }
  return shadows.highlight.top;
}

// =============================================================================
// EXPORT MATERIAL SYSTEM
// =============================================================================

export const materials = {
  surfaceOpacity,
  borders,
  shadows: materialShadows,
  parchmentColors,
  getMaterialBackground,
  getMaterialBorder,
  getMaterialShadows,
} as const;

export default materials;
