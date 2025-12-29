'use client';

import {
  MessageCircle,
  BookOpen,
  Globe,
  Lightbulb,
  Send,
  Moon,
  Sun,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  ThumbsUp,
  ThumbsDown,
  AlertCircle,
  Search,
  Home,
  User,
  Settings,
  LogIn,
  LogOut,
  Heart,
  Quote,
  Bookmark,
  ExternalLink,
  Copy,
  Check,
  Loader2,
  type LucideProps,
} from 'lucide-react';

// Custom Rumi-themed icons as SVG components
export const RumiLogo = (props: LucideProps) => (
  <svg
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    {/* Mosque dome silhouette */}
    <path
      d="M24 4C24 4 16 12 16 20C16 28 24 32 24 32C24 32 32 28 32 20C32 12 24 4 24 4Z"
      fill="currentColor"
      opacity="0.2"
    />
    <path
      d="M24 8C24 8 18 14 18 20C18 26 24 30 24 30C24 30 30 26 30 20C30 14 24 8 24 8Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    {/* Minaret */}
    <path
      d="M10 44V28C10 26 12 24 12 24C12 24 14 26 14 28V44"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M34 44V28C34 26 36 24 36 24C36 24 38 26 38 28V44"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    {/* Base */}
    <path
      d="M8 44H40"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <path
      d="M16 44V34C16 32 24 28 24 28C24 28 32 32 32 34V44"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    {/* Star decoration */}
    <circle cx="24" cy="18" r="2" fill="currentColor" />
  </svg>
);

export const WhirlingDervish = (props: LucideProps) => (
  <svg
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    {/* Person in whirling pose */}
    <circle cx="32" cy="14" r="6" stroke="currentColor" strokeWidth="2" />
    <path
      d="M32 20V32"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
    {/* Arms extended */}
    <path
      d="M20 28L32 26L44 28"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    {/* Flowing robe/skirt */}
    <path
      d="M32 32C32 32 20 36 16 52C16 52 24 56 32 56C40 56 48 52 48 52C44 36 32 32 32 32Z"
      stroke="currentColor"
      strokeWidth="2"
      fill="currentColor"
      fillOpacity="0.1"
    />
    {/* Motion lines */}
    <path
      d="M12 40C14 42 16 44 20 44"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      opacity="0.5"
    />
    <path
      d="M52 40C50 42 48 44 44 44"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      opacity="0.5"
    />
  </svg>
);

export const FeatherQuill = (props: LucideProps) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      d="M20 2C20 2 14 8 10 12C6 16 4 20 4 22L6 20C8 18 12 16 16 12C20 8 20 2 20 2Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="currentColor"
      fillOpacity="0.1"
    />
    <path
      d="M15 5L17 3"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <path
      d="M4 22L6 20"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

export const PersianPattern = (props: LucideProps) => (
  <svg
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    {/* Geometric Islamic pattern */}
    <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="1" opacity="0.3" />
    <circle cx="50" cy="50" r="30" stroke="currentColor" strokeWidth="1" opacity="0.3" />
    <circle cx="50" cy="50" r="20" stroke="currentColor" strokeWidth="1" opacity="0.3" />
    {/* 8-pointed star */}
    <path
      d="M50 10L55 40L90 50L55 60L50 90L45 60L10 50L45 40Z"
      stroke="currentColor"
      strokeWidth="1"
      opacity="0.2"
    />
    <path
      d="M21 21L45 45L21 79L45 55L79 79L55 55L79 21L55 45Z"
      stroke="currentColor"
      strokeWidth="1"
      opacity="0.2"
    />
  </svg>
);

// Re-export Lucide icons with consistent naming
export {
  MessageCircle as ChatIcon,
  BookOpen as BooksIcon,
  Globe as LanguageIcon,
  Lightbulb as InspirationIcon,
  Send as SendIcon,
  Moon as MoonIcon,
  Sun as SunIcon,
  Menu as MenuIcon,
  X as CloseIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  ThumbsUp as ThumbsUpIcon,
  ThumbsDown as ThumbsDownIcon,
  AlertCircle as ReportIcon,
  Search as SearchIcon,
  Home as HomeIcon,
  User as UserIcon,
  Settings as SettingsIcon,
  LogIn as LoginIcon,
  LogOut as LogoutIcon,
  Heart as HeartIcon,
  Quote as QuoteIcon,
  Bookmark as BookmarkIcon,
  ExternalLink as ExternalLinkIcon,
  Copy as CopyIcon,
  Check as CheckIcon,
  Loader2 as LoaderIcon,
};
