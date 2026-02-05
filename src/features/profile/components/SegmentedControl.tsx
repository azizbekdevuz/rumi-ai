'use client';

import { motion } from 'framer-motion';
import { useReducedMotion } from '@/lib/hooks';
import styles from '@/app/profile/profile.module.css';

interface SegmentedControlOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

interface SegmentedControlProps {
  options: SegmentedControlOption[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export default function SegmentedControl({
  options,
  value,
  onChange,
  className = '',
}: SegmentedControlProps) {
  const reducedMotion = useReducedMotion();

  return (
    <div className={`${styles.profileSegmentedControl} ${className}`}>
      {options.map((option) => {
        const isSelected = option.value === value;
        return (
          <motion.button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`${styles.profileSegmentedOption} ${isSelected ? styles.profileSegmentedOptionSelected : ''}`}
            whileHover={reducedMotion ? undefined : {}}
            whileTap={reducedMotion ? undefined : {}}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            {option.icon && <span className={styles.profileSegmentedIcon}>{option.icon}</span>}
            <span>{option.label}</span>
          </motion.button>
        );
      })}
    </div>
  );
}
