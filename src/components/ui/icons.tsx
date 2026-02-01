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
  MessageSquareDiff,
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
  MessageSquareDiff as MsgSquareIcon,
};
