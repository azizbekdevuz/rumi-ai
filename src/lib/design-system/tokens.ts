/**
 * Rumi AI Design System Tokens
 * 
 * Premium spiritual design language inspired by Persian aesthetics.
 * Colors evoke parchment, watercolor, teal tilework, and golden accents.
 */

// =============================================================================
// COLOR TOKENS
// =============================================================================

export const colors = {
  // Parchment/Background Scale - warm, aged paper feel
  parchment: {
    50: '#FDFCF8',
    100: '#FAF7F0',
    200: '#F5F0E5',
    300: '#EDE5D5',
    400: '#E2D5BF',
    500: '#D4C4A8',
    600: '#C4B08A',
  },

  // Sky/Atmosphere - ethereal gradients
  sky: {
    light: '#F8F6F1',
    base: '#F0EDE4',
    warm: '#EDE8DB',
    gradient: 'linear-gradient(180deg, #F5F3ED 0%, #EDE8DB 50%, #E5DFD0 100%)',
    gradientDark: 'linear-gradient(180deg, #1A1F2E 0%, #242B3D 50%, #1A1F2E 100%)',
  },

  // Primary Teal - Persian tilework inspiration
  teal: {
    50: '#E6F4F2',
    100: '#CCE9E5',
    200: '#99D3CB',
    300: '#66BDB1',
    400: '#339797',
    500: '#1B7B6B', // Primary
    600: '#156358',
    700: '#104B44',
    800: '#0B3A35',
    900: '#072826',
  },

  // Gold/Amber - warmth and premium feel
  gold: {
    50: '#FEF9E7',
    100: '#FDF3CF',
    200: '#FBE79F',
    300: '#F5D56F',
    400: '#E8BC3F',
    500: '#D4A84B', // Primary
    600: '#B8923D',
    700: '#9C7C30',
    800: '#806524',
    900: '#5C4A1A',
    gradient: 'linear-gradient(135deg, #E8C15D 0%, #D4A84B 50%, #C49539 100%)',
    shimmer: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)',
  },

  // Text colors
  text: {
    heading: '#2D3748',
    body: '#4A5568',
    muted: '#718096',
    subtle: '#A0AEC0',
    inverse: '#FFFFFF',
    // Dark theme
    headingDark: '#F7FAFC',
    bodyDark: '#E2E8F0',
    mutedDark: '#A0AEC0',
  },

  // Dark theme backgrounds
  dark: {
    primary: '#1A1F2E',
    secondary: '#242B3D',
    tertiary: '#2E364A',
    elevated: '#363F56',
    border: '#3D4659',
  },

  // Semantic colors
  semantic: {
    success: '#38A169',
    warning: '#D69E2E',
    error: '#E53E3E',
    info: '#3182CE',
  },
} as const;

// =============================================================================
// SHADOW TOKENS
// =============================================================================

export const shadows = {
  // Soft, diffused shadows for spiritual feel
  none: 'none',
  sm: '0 2px 8px rgba(45, 55, 72, 0.06)',
  md: '0 4px 16px rgba(45, 55, 72, 0.08)',
  lg: '0 8px 32px rgba(45, 55, 72, 0.12)',
  xl: '0 16px 48px rgba(45, 55, 72, 0.16)',
  '2xl': '0 24px 64px rgba(45, 55, 72, 0.20)',

  // Interactive state shadows
  card: {
    rest: '0 4px 20px rgba(45, 55, 72, 0.08)',
    hover: '0 12px 40px rgba(27, 123, 107, 0.15)',
    active: '0 4px 12px rgba(45, 55, 72, 0.12)',
  },

  // Button glows
  button: {
    teal: '0 4px 20px rgba(27, 123, 107, 0.3)',
    tealHover: '0 8px 32px rgba(27, 123, 107, 0.4)',
    gold: '0 4px 20px rgba(212, 168, 75, 0.4)',
    goldHover: '0 8px 32px rgba(212, 168, 75, 0.5)',
  },

  // Inner shadows for depth
  inner: {
    sm: 'inset 0 2px 4px rgba(0, 0, 0, 0.06)',
    md: 'inset 0 4px 8px rgba(0, 0, 0, 0.1)',
  },

  // Dark theme shadows (more subtle)
  dark: {
    sm: '0 2px 8px rgba(0, 0, 0, 0.2)',
    md: '0 4px 16px rgba(0, 0, 0, 0.3)',
    lg: '0 8px 32px rgba(0, 0, 0, 0.4)',
  },
} as const;

// =============================================================================
// TYPOGRAPHY TOKENS
// =============================================================================

export const typography = {
  // Font families
  fonts: {
    display: '"Playfair Display", Georgia, "Times New Roman", serif',
    body: '"Source Sans 3", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    persian: '"Vazirmatn", "Noto Naskh Arabic", "Tahoma", serif',
    persianDisplay: '"Noto Nastaliq Urdu", "Vazirmatn", serif',
    mono: '"JetBrains Mono", "Fira Code", Consolas, monospace',
  },

  // Font sizes (rem)
  sizes: {
    xs: '0.75rem',    // 12px
    sm: '0.875rem',   // 14px
    base: '1rem',     // 16px
    lg: '1.125rem',   // 18px
    xl: '1.25rem',    // 20px
    '2xl': '1.5rem',  // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem', // 36px
    '5xl': '3rem',    // 48px
    '6xl': '3.75rem', // 60px
    '7xl': '4.5rem',  // 72px
  },

  // Line heights
  lineHeights: {
    none: '1',
    tight: '1.25',
    snug: '1.375',
    normal: '1.5',
    relaxed: '1.625',
    loose: '2',
  },

  // Font weights
  weights: {
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },

  // Letter spacing
  tracking: {
    tighter: '-0.05em',
    tight: '-0.025em',
    normal: '0',
    wide: '0.025em',
    wider: '0.05em',
    widest: '0.1em',
  },
} as const;

// =============================================================================
// SPACING TOKENS
// =============================================================================

export const spacing = {
  px: '1px',
  0: '0',
  0.5: '0.125rem',  // 2px
  1: '0.25rem',     // 4px
  1.5: '0.375rem',  // 6px
  2: '0.5rem',      // 8px
  2.5: '0.625rem',  // 10px
  3: '0.75rem',     // 12px
  3.5: '0.875rem',  // 14px
  4: '1rem',        // 16px
  5: '1.25rem',     // 20px
  6: '1.5rem',      // 24px
  7: '1.75rem',     // 28px
  8: '2rem',        // 32px
  9: '2.25rem',     // 36px
  10: '2.5rem',     // 40px
  11: '2.75rem',    // 44px
  12: '3rem',       // 48px
  14: '3.5rem',     // 56px
  16: '4rem',       // 64px
  20: '5rem',       // 80px
  24: '6rem',       // 96px
  28: '7rem',       // 112px
  32: '8rem',       // 128px
  36: '9rem',       // 144px
  40: '10rem',      // 160px
  44: '11rem',      // 176px
  48: '12rem',      // 192px
  52: '13rem',      // 208px
  56: '14rem',      // 224px
  60: '15rem',      // 240px
  64: '16rem',      // 256px
  72: '18rem',      // 288px
  80: '20rem',      // 320px
  96: '24rem',      // 384px
} as const;

// =============================================================================
// BORDER RADIUS TOKENS
// =============================================================================

export const radii = {
  none: '0',
  sm: '4px',
  md: '8px',
  lg: '12px',
  xl: '16px',
  '2xl': '24px',
  '3xl': '32px',
  pill: '9999px',
  full: '50%',
} as const;

// =============================================================================
// Z-INDEX TOKENS
// =============================================================================

export const zIndex = {
  hide: -1,
  auto: 'auto',
  base: 0,
  docked: 10,
  dropdown: 1000,
  sticky: 1100,
  banner: 1200,
  overlay: 1300,
  modal: 1400,
  popover: 1500,
  skipLink: 1600,
  toast: 1700,
  tooltip: 1800,
} as const;

// =============================================================================
// BREAKPOINTS
// =============================================================================

export const breakpoints = {
  xs: '320px',
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

// =============================================================================
// TRANSITIONS
// =============================================================================

export const transitions = {
  durations: {
    instant: '0ms',
    fast: '150ms',
    normal: '300ms',
    slow: '500ms',
    slower: '800ms',
    page: '600ms',
  },

  easings: {
    linear: 'linear',
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    // Premium easings
    outExpo: 'cubic-bezier(0.16, 1, 0.3, 1)',
    outBack: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
    inOutSoft: 'cubic-bezier(0.45, 0, 0.15, 1)',
    spring: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
  },
} as const;

// =============================================================================
// BLUR / GLASS TOKENS
// =============================================================================

export const blur = {
  none: '0',
  sm: '4px',
  md: '8px',
  lg: '16px',
  xl: '24px',
  '2xl': '40px',
  '3xl': '64px',
} as const;

export const glass = {
  light: {
    background: 'rgba(255, 255, 255, 0.7)',
    backdropFilter: 'blur(16px) saturate(180%)',
    border: '1px solid rgba(255, 255, 255, 0.3)',
  },
  dark: {
    background: 'rgba(26, 31, 46, 0.8)',
    backdropFilter: 'blur(16px) saturate(180%)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
  },
} as const;

// =============================================================================
// EXPORT ALL TOKENS
// =============================================================================

export const tokens = {
  colors,
  shadows,
  typography,
  spacing,
  radii,
  zIndex,
  breakpoints,
  transitions,
  blur,
  glass,
} as const;

export default tokens;
