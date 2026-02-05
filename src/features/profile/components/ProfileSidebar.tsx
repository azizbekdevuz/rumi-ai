'use client';

import { Settings, MessageSquare, Bookmark } from 'lucide-react';
import { motion } from 'framer-motion';
import { useReducedMotion } from '@/lib/hooks';
import { useI18n } from '@/lib/i18n/i18n-context';
import styles from '@/app/profile/profile.module.css';

export type ProfileSection = 'account' | 'history' | 'quotes';

interface ProfileSidebarProps {
  activeSection: ProfileSection;
  onSectionChange: (section: ProfileSection) => void;
  labels: {
    account: string;
    history: string;
    quotes: string;
  };
}

const sections: Array<{ id: ProfileSection; icon: React.ReactNode }> = [
  { id: 'account', icon: <Settings className="w-4 h-4" /> },
  { id: 'history', icon: <MessageSquare className="w-4 h-4" /> },
  { id: 'quotes', icon: <Bookmark className="w-4 h-4" /> },
];

export default function ProfileSidebar({ activeSection, onSectionChange, labels }: ProfileSidebarProps) {
  const reducedMotion = useReducedMotion();
  const { dir } = useI18n();
  const isRTL = dir === 'rtl';

  return (
    <nav className="profile-sidebar" aria-label="Profile navigation">
      {sections.map((section) => {
        const isActive = activeSection === section.id;
        return (
          <motion.button
            key={section.id}
            type="button"
            onClick={() => onSectionChange(section.id)}
            className={`${styles.profileSidebarItem} ${isActive ? styles.profileSidebarItemActive : ''}`}
            whileHover={reducedMotion ? undefined : { x: isRTL ? -4 : 4 }}
            whileTap={reducedMotion ? undefined : { scale: 0.98 }}
            transition={{ duration: 0.15 }}
          >
            <span className={styles.profileSidebarIcon}>{section.icon}</span>
            <span className={styles.profileSidebarLabel}>{labels[section.id]}</span>
          </motion.button>
        );
      })}
    </nav>
  );
}
