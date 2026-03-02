'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { useI18n } from '@/lib/i18n/i18n-context';
import { useTheme } from '@/lib/theme/theme-context';
import { useAuth } from '@/lib/auth/auth-context';
import { useReducedMotion } from '@/lib/hooks';
import { ChevronRight, ChevronLeft, Sun, Moon, MessageSquare } from 'lucide-react';
import ProfilePageShell from '@/features/profile/components/ProfilePageShell';
import ProfileSidebar, { type ProfileSection } from '@/features/profile/components/ProfileSidebar';
import SegmentedControl from '@/features/profile/components/SegmentedControl';
import ToggleSwitch from '@/features/profile/components/ToggleSwitch';
import styles from './profile.module.css';

// ── Chat session type from backend ──────────────────────────────
interface ChatSessionItem {
  id: string;
  created_at: string;
  source_mode: string | null;
  /** First user message text — returned by backend directly */
  preview: string;
  message_count: number;
}

export default function ProfilePage() {
  const { language, dir, setLanguage } = useI18n();
  const direction = dir;
  const { theme, toggleTheme } = useTheme();
  const { user: authUser, status: authStatus } = useAuth();
  const reducedMotion = useReducedMotion();
  const router = useRouter();

  // Gate client-derived values (language, theme) behind a mount check
  // to avoid hydration mismatches from localStorage-based providers.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const [activeSection, setActiveSection] = useState<ProfileSection>('account');
  const [emailUpdates, setEmailUpdates] = useState(true);
  const [accountDeletion, setAccountDeletion] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // ── Chat history state ──
  const [chatSessions, setChatSessions] = useState<ChatSessionItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState('');
  // Guard against infinite retries — only fetch once per tab switch
  const historyFetchedForUserRef = useRef<string | null>(null);

  // ── Clear chat history when user changes (sign-out / sign-in) ──
  const currentUserId = authUser?.id ?? null;
  useEffect(() => {
    // If the user identity changed, reset cached history so the new
    // user's sessions will be fetched on the next tab switch.
    if (historyFetchedForUserRef.current !== currentUserId) {
      setChatSessions([]);
      setHistoryError('');
      historyFetchedForUserRef.current = null; // mark as not-yet-fetched
    }
  }, [currentUserId]);

  /** Fetch chat sessions — single request, backend returns preview + count */
  const fetchChatSessions = useCallback(async () => {
    if (authStatus !== 'authenticated') return;
    setHistoryLoading(true);
    setHistoryError('');
    try {
      const resp = await fetch('/api/sessions');
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const sessions: ChatSessionItem[] = await resp.json();
      setChatSessions(sessions);
      // Mark this user's history as fetched
      historyFetchedForUserRef.current = currentUserId;
    } catch (err) {
      setHistoryError(err instanceof Error ? err.message : 'Failed to load history');
      // Still mark as fetched to prevent infinite retries
      historyFetchedForUserRef.current = currentUserId;
    } finally {
      setHistoryLoading(false);
    }
  }, [authStatus, currentUserId]);

  // Fetch chat history when switching to the history tab (once per user)
  useEffect(() => {
    if (
      activeSection === 'history' &&
      authStatus === 'authenticated' &&
      historyFetchedForUserRef.current !== currentUserId &&
      !historyLoading
    ) {
      fetchChatSessions();
    }
  }, [activeSection, authStatus, currentUserId, historyLoading, fetchChatSessions]);

  /** Navigate to /chat with a specific session loaded */
  const openChat = (sessionId: string) => {
    // Store the session id so the chat page can pick it up
    if (typeof window !== 'undefined') {
      localStorage.setItem('rumi_chat_session_id', sessionId);
    }
    router.push(`/chat?session=${sessionId}`);
  };

  // Derive display values from auth state (graceful fallbacks)
  const user = {
    name: authUser?.email?.split('@')[0] ?? 'Default User',
    email: authUser?.email ?? '',
    avatar: null as string | null,
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

  // Use server-safe defaults until mounted to prevent hydration mismatch
  const safeLanguage = mounted ? language : 'en';
  const safeTheme = mounted ? theme : 'light';
  const c = content[safeLanguage] || content.en;

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
    setIsSaving(true);
    setSaveError('');
    setSaveSuccess(false);

    try {
      const resp = await fetch('/api/user/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          preferred_lang: language,
          theme,
        }),
      });

      if (!resp.ok) {
        const data = await resp.json().catch(() => null);
        setSaveError(data?.message ?? 'Failed to save settings');
        return;
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch {
      setSaveError('Network error — please try again');
    } finally {
      setIsSaving(false);
    }
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
      <div className="profile-page-content" dir={mounted ? direction : 'ltr'}>
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
                        value={safeLanguage}
                        onChange={handleLanguageChange}
                      />
                  </div>

                    {/* Theme Selector */}
                    <div className="profile-setting-item">
                      <label className={styles.profileSettingLabel}>{c.theme}</label>
                      <SegmentedControl
                        options={themeOptions}
                        value={safeTheme}
                        onChange={handleThemeChange}
                    />
                  </div>

                    {/* Save Changes Button */}
                    <div className="profile-save-button-wrapper">
                      <motion.button
                        type="button"
                        onClick={handleSave}
                        disabled={isSaving || authStatus !== 'authenticated'}
                        className={styles.profileSaveButton}
                        whileHover={reducedMotion ? undefined : {}}
                        whileTap={reducedMotion ? undefined : {}}
                        transition={{ duration: 0.15 }}
                      >
                        {isSaving ? '...' : c.saveChanges}
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
                      {saveError && (
                        <motion.div
                          className="profile-save-success"
                          style={{ color: 'var(--error, #c0392b)' }}
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                        >
                          {saveError}
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

                  {historyLoading && (
                    <div className="profile-empty-state">
                      <p>Loading...</p>
                    </div>
                  )}

                  {historyError && (
                    <div className="profile-empty-state">
                      <p style={{ color: 'var(--error, #c0392b)' }}>{historyError}</p>
                    </div>
                  )}

                  {!historyLoading && !historyError && chatSessions.length === 0 && (
                  <div className="profile-empty-state">
                    <p>{c.noHistory}</p>
                      </div>
                  )}

                  {!historyLoading && chatSessions.length > 0 && (
                    <div className="profile-chat-history-list">
                      {chatSessions.map((session) => (
                        <motion.button
                          key={session.id}
                          className="profile-chat-history-item"
                          onClick={() => openChat(session.id)}
                          initial={reducedMotion ? {} : { opacity: 0, y: 8 }}
                          animate={reducedMotion ? {} : { opacity: 1, y: 0 }}
                          whileHover={reducedMotion ? undefined : { x: 4 }}
                          transition={{ duration: 0.2 }}
                        >
                          <div className="profile-chat-history-icon">
                            <MessageSquare size={18} />
                          </div>
                          <div className="profile-chat-history-info">
                            <p className="profile-chat-history-preview">
                              {session.preview || 'Chat session'}
                            </p>
                            <span className="profile-chat-history-meta">
                              {new Date(session.created_at).toLocaleDateString(
                                safeLanguage === 'fa' ? 'fa-IR' : safeLanguage === 'kr' ? 'ko-KR' : 'en-US',
                                { year: 'numeric', month: 'short', day: 'numeric' },
                              )}
                              {session.message_count ? ` · ${session.message_count} messages` : ''}
                            </span>
                          </div>
                          <ChevronRight size={16} className="profile-chat-history-arrow" />
                        </motion.button>
                      ))}
                    </div>
                  )}
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
