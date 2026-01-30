'use client';

import { motion } from 'framer-motion';
import { useReducedMotion } from '@/lib/hooks';
import { useRouter } from 'next/navigation';
import { SendIcon, ReportIcon } from '@/components/ui/icons';

interface UtilityBarProps {
  onSend: () => void;
  onReport: () => void;
  canSend: boolean;
}

export default function UtilityBar({ onSend, onReport, canSend }: UtilityBarProps) {
  const reducedMotion = useReducedMotion();
  const router = useRouter();

  const handleSearchBooks = () => {
    router.push('/books');
  };

  const buttonVariants = reducedMotion
    ? undefined
    : {
        hover: { scale: 1.02, y: -2 },
        tap: { scale: 0.98 },
      };

  const goldButtonVariants = reducedMotion
    ? undefined
    : {
        hover: { scale: 1.03, y: -3 },
        tap: { scale: 0.97 },
      };

  return (
    <div className="chat-utility-bar">
      {/* Left: Search Books pill button */}
      <motion.button
        className="chat-utility-search-books"
        onClick={handleSearchBooks}
        aria-label="Search books"
        variants={buttonVariants}
        whileHover={reducedMotion ? {} : 'hover'}
        whileTap={reducedMotion ? {} : 'tap'}
      >
        Search Books
      </motion.button>

      {/* Middle: Report Issue */}
      <motion.button
        className="chat-utility-report"
        onClick={onReport}
        aria-label="Report issue"
        variants={buttonVariants}
        whileHover={reducedMotion ? {} : 'hover'}
        whileTap={reducedMotion ? {} : 'tap'}
      >
        <ReportIcon style={{ width: 14, height: 14 }} aria-hidden="true" />
        <span>Having problems? Report Issue.</span>
      </motion.button>

      {/* Right: Large gold Send button */}
      <motion.button
        className="chat-utility-send-gold"
        onClick={onSend}
        disabled={!canSend}
        aria-label="Send message"
        variants={goldButtonVariants}
        whileHover={reducedMotion || !canSend ? {} : 'hover'}
        whileTap={reducedMotion || !canSend ? {} : 'tap'}
      >
        <span>Send</span>
        <SendIcon style={{ width: 18, height: 18 }} aria-hidden="true" />
      </motion.button>
    </div>
  );
}
