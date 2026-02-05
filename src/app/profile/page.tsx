'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { useI18n } from '@/lib/i18n/i18n-context';
import { useTheme } from '@/lib/theme/theme-context';
import { useReducedMotion } from '@/lib/hooks';
import { ChevronRight, ChevronLeft, Sun, Moon } from 'lucide-react';
import ProfilePageShell from '@/features/profile/components/ProfilePageShell';
import ProfileSidebar, { type ProfileSection } from '@/features/profile/components/ProfileSidebar';
import SegmentedControl from '@/features/profile/components/SegmentedControl';
import ToggleSwitch from '@/features/profile/components/ToggleSwitch';
import styles from './profile.module.css';

export default function ProfilePage() {
  const { language, dir, setLanguage } = useI18n();
  const direction = dir;
  const { theme, toggleTheme } = useTheme();
  const reducedMotion = useReducedMotion();
  const [activeSection, setActiveSection] = useState<ProfileSection>('account');
  const [emailUpdates, setEmailUpdates] = useState(true);
  const [accountDeletion, setAccountDeletion] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Mock user data - in real app, fetch from API
  const user = {
    name: 'Mohammad Niaraki',
    email: 'mohammad.niaraki@email.com',
    avatar: null,
  };

  const content = {
    en: {
      title: 'Your Profile',
      breadcrumb: 'Home / Profile',
      accountSettings: 'Account Settings',
      chatHistory: 'Chat History',
      savedQuotes: 'Saved Quotes',
      preferredLanguage: 'Preferred Language',
        theme: 'Theme',
      light: 'Light',
      dark: 'Dark',
      saveChanges: 'Save Changes',
      consentPrivacy: 'Consent & Privacy',
      emailUpdates: 'Receive Email Updates',
      emailUpdatesDesc: 'Get occasional updates and special offers.',
      accountDeletion: 'Account Deletion Request',
      accountDeletionDesc: 'Request account to be permanently deleted.',
      privacyPolicy: 'Privacy Policy',
      contactUs: 'Contact Us',
      noHistory: 'No chat history yet. Start a conversation!',
      noQuotes: 'No saved quotes yet. Save verses you love!',
      saved: 'Changes saved successfully',
    },
    fa: {
      title: 'پروفایل شما',
      breadcrumb: 'خانه / پروفایل',
      accountSettings: 'تنظیمات حساب',
      chatHistory: 'تاریخچه چت',
      savedQuotes: 'نقل‌قول‌های ذخیره شده',
      preferredLanguage: 'زبان ترجیحی',
        theme: 'تم',
      light: 'روشن',
      dark: 'تاریک',
      saveChanges: 'ذخیره تغییرات',
      consentPrivacy: 'رضایت و حریم خصوصی',
      emailUpdates: 'دریافت به‌روزرسانی‌های ایمیل',
      emailUpdatesDesc: 'دریافت به‌روزرسانی‌ها و پیشنهادات ویژه.',
      accountDeletion: 'درخواست حذف حساب',
      accountDeletionDesc: 'درخواست حذف دائمی حساب.',
      privacyPolicy: 'سیاست حفظ حریم خصوصی',
      contactUs: 'تماس با ما',
      noHistory: 'هنوز تاریخچه چتی وجود ندارد. گفتگو را شروع کنید!',
      noQuotes: 'هنوز نقل‌قولی ذخیره نشده است. ابیاتی که دوست دارید را ذخیره کنید!',
      saved: 'تغییرات با موفقیت ذخیره شد',
    },
    kr: {
      title: '프로필',
      breadcrumb: '홈 / 프로필',
      accountSettings: '계정 설정',
      chatHistory: '채팅 기록',
      savedQuotes: '저장된 인용구',
      preferredLanguage: '선호 언어',
        theme: '테마',
      light: '라이트',
      dark: '다크',
      saveChanges: '변경 사항 저장',
      consentPrivacy: '동의 및 개인정보',
      emailUpdates: '이메일 업데이트 받기',
      emailUpdatesDesc: '가끔 업데이트와 특별 제안을 받으세요.',
      accountDeletion: '계정 삭제 요청',
      accountDeletionDesc: '계정을 영구적으로 삭제하도록 요청합니다.',
      privacyPolicy: '개인정보 처리방침',
      contactUs: '문의하기',
      noHistory: '아직 채팅 기록이 없습니다. 대화를 시작하세요!',
      noQuotes: '아직 저장된 인용구가 없습니다. 좋아하는 시구를 저장하세요!',
      saved: '변경 사항이 성공적으로 저장되었습니다',
    },
  };

  const c = content[language] || content.en;

  const languageOptions = [
    { value: 'fa', label: 'FA' },
    { value: 'en', label: 'EN' },
    { value: 'kr', label: 'KR' },
  ];

  const themeOptions = [
    { value: 'light', label: c.light, icon: <Sun className="w-4 h-4" /> },
    { value: 'dark', label: c.dark, icon: <Moon className="w-4 h-4" /> },
  ];

  const handleSave = async () => {
    // TODO: Call API to save settings
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleLanguageChange = (value: string) => {
    setLanguage(value as 'en' | 'fa' | 'kr');
  };

  const handleThemeChange = (value: string) => {
    if (value === 'dark' && theme === 'light') {
      toggleTheme();
    } else if (value === 'light' && theme === 'dark') {
      toggleTheme();
    }
  };

  return (
    <ProfilePageShell>
      <div className="profile-page-content" dir={direction}>
        {/* Hero Title Block */}
        <motion.div
          className="profile-hero"
          initial={reducedMotion ? {} : { opacity: 0, y: 20 }}
          animate={reducedMotion ? {} : { opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <h1 className="profile-hero-title">{c.title}</h1>
          <div className="profile-breadcrumb">
            {direction === 'rtl' ? (
              <ChevronLeft className="profile-breadcrumb-icon" />
            ) : (
              <ChevronRight className="profile-breadcrumb-icon" />
            )}
            <span>{c.breadcrumb}</span>
        </div>
        </motion.div>

        {/* Main Profile Panel */}
        <motion.div
          className={styles.profileMainPanel}
          initial={reducedMotion ? {} : { opacity: 0, y: 20 }}
          animate={reducedMotion ? {} : { opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Panel Header Section */}
          <div className="profile-panel-header">
            <div className="profile-avatar-wrapper">
              {user.avatar ? (
                <Image 
                  src={user.avatar} 
                  alt={user.name} 
                  className={styles.profileAvatarImage} 
                  width={96} 
                  height={96} 
                  priority
                />
              ) : (
                <div className="profile-avatar-placeholder">
                  <Image 
                    src="/img/chat/default-avatar-male.webp" 
                    alt={user.name} 
                    width={96} 
                    height={96} 
                    className={styles.profileAvatarImage}
                    priority
                  />
              </div>
              )}
              </div>
            <div className="profile-header-info">
              <h2 className="profile-user-name">{user.name}</h2>
              <p className="profile-user-email">{user.email}</p>
            </div>
          </div>
          <div className={styles.profileHeaderDivider} />

          {/* Panel Content */}
          <div className="profile-panel-content">
            {/* Left Sidebar Navigation */}
            <ProfileSidebar
              activeSection={activeSection}
              onSectionChange={setActiveSection}
              labels={{
                account: c.accountSettings,
                history: c.chatHistory,
                quotes: c.savedQuotes,
              }}
            />

            {/* Main Content Area - Inner Surface */}
            <div className={styles.profileContentArea}>
              {activeSection === 'account' && (
                <motion.div
                  initial={reducedMotion ? {} : { opacity: 0, x: 20 }}
                  animate={reducedMotion ? {} : { opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <h3 className={styles.profileSectionTitle}>{c.accountSettings}</h3>
                  <div className={styles.profileSectionDivider} />

                  <div className="profile-settings-group">
                    {/* Preferred Language Selector */}
                    <div className="profile-setting-item">
                      <label className={styles.profileSettingLabel}>{c.preferredLanguage}</label>
                      <SegmentedControl
                        options={languageOptions}
                        value={language}
                        onChange={handleLanguageChange}
                      />
                  </div>

                    {/* Theme Selector */}
                    <div className="profile-setting-item">
                      <label className={styles.profileSettingLabel}>{c.theme}</label>
                      <SegmentedControl
                        options={themeOptions}
                        value={theme}
                        onChange={handleThemeChange}
                    />
                  </div>

                    {/* Save Changes Button */}
                    <div className="profile-save-button-wrapper">
                      <motion.button
                        type="button"
                        onClick={handleSave}
                        className={styles.profileSaveButton}
                        whileHover={reducedMotion ? undefined : {}}
                        whileTap={reducedMotion ? undefined : {}}
                        transition={{ duration: 0.15 }}
                      >
                        {c.saveChanges}
                      </motion.button>
                      {saveSuccess && (
                        <motion.div
                          className="profile-save-success"
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                        >
                          {c.saved}
                        </motion.div>
                        )}
                      </div>
                  </div>

                  {/* Consent & Privacy Section */}
                  <div className={styles.profileConsentSection}>
                    <h4 className={styles.profileConsentTitle}>{c.consentPrivacy}</h4>
                    <div className={styles.profileConsentDivider} />
                    <div className="profile-consent-content">
                      <ToggleSwitch
                        checked={emailUpdates}
                        onChange={setEmailUpdates}
                        label={c.emailUpdates}
                        helperText={c.emailUpdatesDesc}
                      />
                      <ToggleSwitch
                        checked={accountDeletion}
                        onChange={setAccountDeletion}
                        label={c.accountDeletion}
                        helperText={c.accountDeletionDesc}
                      />
                </div>
              </div>
                </motion.div>
              )}

              {activeSection === 'history' && (
                <motion.div
                  initial={reducedMotion ? {} : { opacity: 0, x: 20 }}
                  animate={reducedMotion ? {} : { opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <h3 className={styles.profileSectionTitle}>{c.chatHistory}</h3>
                  <div className={styles.profileSectionDivider} />
                  <div className="profile-empty-state">
                    <p>{c.noHistory}</p>
                      </div>
                </motion.div>
              )}

              {activeSection === 'quotes' && (
                <motion.div
                  initial={reducedMotion ? {} : { opacity: 0, x: 20 }}
                  animate={reducedMotion ? {} : { opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <h3 className={styles.profileSectionTitle}>{c.savedQuotes}</h3>
                  <div className={styles.profileSectionDivider} />
                  <div className="profile-empty-state">
                    <p>{c.noQuotes}</p>
                      </div>
                </motion.div>
              )}
                </div>
              </div>
        </motion.div>

        {/* Footer Links */}
        <motion.div
          className="profile-footer-links"
          initial={reducedMotion ? {} : { opacity: 0 }}
          animate={reducedMotion ? {} : { opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <Link href="/privacy" className="profile-footer-link">
            {c.privacyPolicy}
          </Link>
          <span className="profile-footer-separator">|</span>
          <Link href="/contact" className="profile-footer-link">
            {c.contactUs}
          </Link>
        </motion.div>
          </div>
    </ProfilePageShell>
  );
}
