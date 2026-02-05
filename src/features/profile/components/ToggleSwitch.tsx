'use client';

import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { useReducedMotion } from '@/lib/hooks';
import styles from '@/app/profile/profile.module.css';

interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  helperText?: string;
  className?: string;
}

export default function ToggleSwitch({
  checked,
  onChange,
  label,
  helperText,
  className = '',
}: ToggleSwitchProps) {
  const reducedMotion = useReducedMotion();

  return (
    <div className={`profile-toggle-row ${className}`}>
      <div className="profile-toggle-content">
        <label className="profile-toggle-label">{label}</label>
        {helperText && <p className={styles.profileToggleHelper}>{helperText}</p>}
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`${styles.profileToggleSwitch} ${checked ? styles.profileToggleSwitchChecked : ''}`}
        aria-label={label}
        aria-pressed={checked}
      >
        <motion.div
          className={styles.profileToggleKnob}
          animate={reducedMotion ? {} : {
            x: checked ? 26 : 0,
          }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
        >
          {checked && (
            <motion.div
              initial={reducedMotion ? {} : { scale: 0, opacity: 0 }}
              animate={reducedMotion ? {} : { scale: 1, opacity: 1 }}
              transition={{ duration: 0.15, delay: 0.05 }}
            >
              <Check className={styles.profileToggleCheck} />
            </motion.div>
          )}
        </motion.div>
      </button>
    </div>
  );
}
