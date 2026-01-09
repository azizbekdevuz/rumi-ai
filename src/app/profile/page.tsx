'use client';

import { useState } from 'react';
import { useI18n } from '@/lib/i18n/i18n-context';
import { useTheme } from '@/lib/theme/theme-context';
import {
  User,
  Mail,
  Globe,
  Moon,
  Sun,
  Bell,
  Shield,
  LogOut,
  ChevronRight,
  ChevronLeft,
  Save,
  History,
  Heart,
  BookMarked,
} from 'lucide-react';

export default function ProfilePage() {
  const { t, language, dir, setLanguage } = useI18n();
  const direction = dir;
  const { theme, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<'profile' | 'preferences' | 'history'>('profile');

  const ChevronIcon = direction === 'rtl' ? ChevronLeft : ChevronRight;

  const content = {
    en: {
      title: 'Profile & Settings',
      tabs: {
        profile: 'Profile',
        preferences: 'Preferences',
        history: 'History',
      },
      profile: {
        title: 'Personal Information',
        name: 'Full Name',
        email: 'Email',
        bio: 'Bio',
        bioPlaceholder: 'Tell us about yourself...',
        save: 'Save Changes',
      },
      preferences: {
        title: 'App Preferences',
        language: 'Language',
        theme: 'Theme',
        themeLight: 'Light',
        themeDark: 'Dark',
        notifications: 'Notifications',
        notificationsDesc: 'Receive daily wisdom notifications',
        privacy: 'Privacy',
        privacyDesc: 'Manage your data and privacy settings',
      },
      history: {
        title: 'Your Activity',
        conversations: 'Recent Conversations',
        favorites: 'Favorite Verses',
        bookmarks: 'Bookmarked Books',
        noHistory: 'No activity yet. Start exploring!',
      },
      logout: 'Sign Out',
    },
    fa: {
      title: 'پروفایل و تنظیمات',
      tabs: {
        profile: 'پروفایل',
        preferences: 'ترجیحات',
        history: 'تاریخچه',
      },
      profile: {
        title: 'اطلاعات شخصی',
        name: 'نام کامل',
        email: 'ایمیل',
        bio: 'بیوگرافی',
        bioPlaceholder: 'درباره خودتان بگویید...',
        save: 'ذخیره تغییرات',
      },
      preferences: {
        title: 'ترجیحات برنامه',
        language: 'زبان',
        theme: 'تم',
        themeLight: 'روشن',
        themeDark: 'تاریک',
        notifications: 'اعلان‌ها',
        notificationsDesc: 'دریافت اعلان‌های حکمت روزانه',
        privacy: 'حریم خصوصی',
        privacyDesc: 'مدیریت داده‌ها و تنظیمات حریم خصوصی',
      },
      history: {
        title: 'فعالیت شما',
        conversations: 'مکالمات اخیر',
        favorites: 'ابیات مورد علاقه',
        bookmarks: 'کتاب‌های نشان‌شده',
        noHistory: 'هنوز فعالیتی نیست. شروع به کاوش کنید!',
      },
      logout: 'خروج',
    },
    kr: {
      title: '프로필 및 설정',
      tabs: {
        profile: '프로필',
        preferences: '환경설정',
        history: '기록',
      },
      profile: {
        title: '개인 정보',
        name: '이름',
        email: '이메일',
        bio: '소개',
        bioPlaceholder: '자신에 대해 알려주세요...',
        save: '변경 사항 저장',
      },
      preferences: {
        title: '앱 환경설정',
        language: '언어',
        theme: '테마',
        themeLight: '라이트',
        themeDark: '다크',
        notifications: '알림',
        notificationsDesc: '일일 지혜 알림 받기',
        privacy: '개인정보',
        privacyDesc: '데이터 및 개인정보 설정 관리',
      },
      history: {
        title: '활동 내역',
        conversations: '최근 대화',
        favorites: '좋아하는 시구',
        bookmarks: '북마크한 책',
        noHistory: '아직 활동이 없습니다. 탐색을 시작하세요!',
      },
      logout: '로그아웃',
    },
  };

  const c = content[language] || content.en;

  // Mock user data
  const user = {
    name: 'Ali Karimi',
    email: 'ali@example.com',
    avatar: null,
  };

  const [name, setName] = useState(user.name);
  const [bio, setBio] = useState('');
  const [notifications, setNotifications] = useState(true);

  return (
    <main className="profile-page" dir={direction}>
      <div className="profile-container">
        {/* Header */}
        <div className="mb-10">
          <h1 
            className="text-4xl font-serif font-bold"
            style={{ color: 'var(--text-primary)' }}
          >
            {c.title}
          </h1>
        </div>

        {/* Profile Card */}
        <div 
          className="rounded-[var(--radius-xl)] overflow-hidden"
          style={{ 
            background: 'var(--bg-tertiary)', 
            boxShadow: 'var(--shadow-lg)',
            border: '1px solid var(--border-color)'
          }}
        >
          {/* User Info Header */}
          <div 
            className="p-8"
            style={{ 
              borderBottom: '1px solid var(--border-color)',
              background: 'linear-gradient(135deg, var(--accent-teal-light) 0%, transparent 50%)'
            }}
          >
            <div className="flex items-center gap-6">
              <div 
                className="w-24 h-24 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: 'var(--accent-teal-light)', border: '3px solid var(--accent-teal)' }}
              >
                <User className="w-12 h-12 text-[var(--accent-teal)]" />
              </div>
              <div>
                <h2 
                  className="text-2xl font-semibold mb-1"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {user.name}
                </h2>
                <p className="text-base" style={{ color: 'var(--text-secondary)' }}>{user.email}</p>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div 
            className="flex"
            style={{ borderBottom: '2px solid var(--border-color)' }}
          >
            {(['profile', 'preferences', 'history'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className="flex-1 py-5 px-6 text-base font-semibold transition-all"
                style={{
                  color: activeTab === tab ? 'var(--accent-teal)' : 'var(--text-secondary)',
                  borderBottom: activeTab === tab ? '3px solid var(--accent-teal)' : '3px solid transparent',
                  background: activeTab === tab ? 'var(--accent-teal-light)' : 'transparent',
                  marginBottom: '-2px'
                }}
              >
                {c.tabs[tab]}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="p-8">
            {activeTab === 'profile' && (
              <div className="space-y-8">
                <h3 
                  className="text-xl font-semibold"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {c.profile.title}
                </h3>

                <div className="space-y-6">
                  <div>
                    <label 
                      className="block text-sm font-semibold mb-3"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {c.profile.name}
                    </label>
                    <div className="relative">
                      <User 
                        className="absolute top-1/2 -translate-y-1/2 w-5 h-5"
                        style={{ 
                          color: 'var(--text-muted)',
                          [direction === 'rtl' ? 'right' : 'left']: '18px'
                        }}
                      />
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="form-input"
                        style={{ 
                          [direction === 'rtl' ? 'paddingRight' : 'paddingLeft']: '52px',
                          width: '100%'
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <label 
                      className="block text-sm font-semibold mb-3"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {c.profile.email}
                    </label>
                    <div className="relative">
                      <Mail 
                        className="absolute top-1/2 -translate-y-1/2 w-5 h-5"
                        style={{ 
                          color: 'var(--text-muted)',
                          [direction === 'rtl' ? 'right' : 'left']: '18px'
                        }}
                      />
                      <input
                        type="email"
                        value={user.email}
                        disabled
                        className="form-input cursor-not-allowed"
                        style={{ 
                          [direction === 'rtl' ? 'paddingRight' : 'paddingLeft']: '52px',
                          opacity: 0.5,
                          background: 'var(--bg-secondary)',
                          width: '100%'
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <label 
                      className="block text-sm font-semibold mb-3"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {c.profile.bio}
                    </label>
                    <textarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder={c.profile.bioPlaceholder}
                      rows={5}
                      className="form-input resize-none"
                      style={{ width: '100%' }}
                    />
                  </div>

                  <button 
                    className="py-4 px-8 rounded-[var(--radius-lg)] font-semibold flex items-center gap-3 transition-all hover:shadow-lg"
                    style={{
                      background: 'var(--gradient-teal)',
                      color: 'var(--text-inverse)'
                    }}
                  >
                    <Save className="w-5 h-5" />
                    {c.profile.save}
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'preferences' && (
              <div className="space-y-8">
                <h3 
                  className="text-xl font-semibold"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {c.preferences.title}
                </h3>

                <div className="space-y-5">
                  {/* Language */}
                  <div 
                    className="flex items-center justify-between p-5 rounded-[var(--radius-lg)]"
                    style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}
                  >
                    <div className="flex items-center gap-4">
                      <div 
                        className="w-10 h-10 rounded-lg flex items-center justify-center"
                        style={{ background: 'var(--accent-teal-light)' }}
                      >
                        <Globe className="w-5 h-5 text-[var(--accent-teal)]" />
                      </div>
                      <span 
                        className="font-semibold text-base"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        {c.preferences.language}
                      </span>
                    </div>
                    <select
                      value={language}
                      onChange={(e) => setLanguage(e.target.value as 'en' | 'fa' | 'kr')}
                      className="py-3 px-5 rounded-[var(--radius-md)] focus:outline-none cursor-pointer"
                      style={{
                        border: '2px solid var(--border-color)',
                        background: 'var(--bg-tertiary)',
                        color: 'var(--text-primary)',
                        fontSize: '15px'
                      }}
                    >
                      <option value="en">English</option>
                      <option value="fa">فارسی</option>
                      <option value="kr">한국어</option>
                    </select>
                  </div>

                  {/* Theme */}
                  <div 
                    className="flex items-center justify-between p-5 rounded-[var(--radius-lg)]"
                    style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}
                  >
                    <div className="flex items-center gap-4">
                      <div 
                        className="w-10 h-10 rounded-lg flex items-center justify-center"
                        style={{ background: 'var(--accent-teal-light)' }}
                      >
                        {theme === 'dark' ? (
                          <Moon className="w-5 h-5 text-[var(--accent-teal)]" />
                        ) : (
                          <Sun className="w-5 h-5 text-[var(--accent-teal)]" />
                        )}
                      </div>
                      <span 
                        className="font-semibold text-base"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        {c.preferences.theme}
                      </span>
                    </div>
                    <button
                      onClick={toggleTheme}
                      className="py-3 px-5 rounded-[var(--radius-md)] transition-colors cursor-pointer"
                      style={{
                        border: '2px solid var(--border-color)',
                        background: 'var(--bg-tertiary)',
                        color: 'var(--text-primary)',
                        fontSize: '15px'
                      }}
                    >
                      {theme === 'dark' ? c.preferences.themeDark : c.preferences.themeLight}
                    </button>
                  </div>

                  {/* Notifications */}
                  <div 
                    className="flex items-center justify-between p-5 rounded-[var(--radius-lg)] gap-4"
                    style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div 
                        className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ background: 'var(--accent-teal-light)' }}
                      >
                        <Bell className="w-5 h-5 text-[var(--accent-teal)]" />
                      </div>
                      <div>
                        <span 
                          className="font-semibold text-base block mb-1"
                          style={{ color: 'var(--text-primary)' }}
                        >
                          {c.preferences.notifications}
                        </span>
                        <span 
                          className="text-sm"
                          style={{ color: 'var(--text-muted)' }}
                        >
                          {c.preferences.notificationsDesc}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => setNotifications(!notifications)}
                      className="w-14 h-7 rounded-full transition-colors flex-shrink-0"
                      style={{
                        background: notifications ? 'var(--accent-teal)' : 'var(--border-color)'
                      }}
                    >
                      <div
                        className="w-6 h-6 rounded-full bg-white shadow transform transition-transform"
                        style={{
                          transform: notifications
                            ? direction === 'rtl' ? 'translateX(-28px)' : 'translateX(28px)'
                            : direction === 'rtl' ? 'translateX(-2px)' : 'translateX(2px)'
                        }}
                      />
                    </button>
                  </div>

                  {/* Privacy */}
                  <button 
                    className="w-full flex items-center justify-between p-5 rounded-[var(--radius-lg)] transition-all hover:shadow-md"
                    style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}
                  >
                    <div className="flex items-center gap-4">
                      <div 
                        className="w-10 h-10 rounded-lg flex items-center justify-center"
                        style={{ background: 'var(--accent-teal-light)' }}
                      >
                        <Shield className="w-5 h-5 text-[var(--accent-teal)]" />
                      </div>
                      <div className="text-start">
                        <span 
                          className="font-semibold text-base block mb-1"
                          style={{ color: 'var(--text-primary)' }}
                        >
                          {c.preferences.privacy}
                        </span>
                        <span 
                          className="text-sm"
                          style={{ color: 'var(--text-muted)' }}
                        >
                          {c.preferences.privacyDesc}
                        </span>
                      </div>
                    </div>
                    <ChevronIcon 
                      className="w-5 h-5"
                      style={{ color: 'var(--text-muted)' }}
                    />
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'history' && (
              <div className="space-y-8">
                <h3 
                  className="text-xl font-semibold"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {c.history.title}
                </h3>

                <div className="space-y-5">
                  {/* Conversations */}
                  <button 
                    className="w-full flex items-center justify-between p-5 rounded-[var(--radius-lg)] transition-all hover:shadow-md"
                    style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}
                  >
                    <div className="flex items-center gap-4">
                      <div 
                        className="w-10 h-10 rounded-lg flex items-center justify-center"
                        style={{ background: 'var(--accent-teal-light)' }}
                      >
                        <History className="w-5 h-5 text-[var(--accent-teal)]" />
                      </div>
                      <span 
                        className="font-semibold text-base"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        {c.history.conversations}
                      </span>
                    </div>
                    <ChevronIcon 
                      className="w-5 h-5"
                      style={{ color: 'var(--text-muted)' }}
                    />
                  </button>

                  {/* Favorites */}
                  <button 
                    className="w-full flex items-center justify-between p-5 rounded-[var(--radius-lg)] transition-all hover:shadow-md"
                    style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}
                  >
                    <div className="flex items-center gap-4">
                      <div 
                        className="w-10 h-10 rounded-lg flex items-center justify-center"
                        style={{ background: 'var(--accent-teal-light)' }}
                      >
                        <Heart className="w-5 h-5 text-[var(--accent-teal)]" />
                      </div>
                      <span 
                        className="font-semibold text-base"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        {c.history.favorites}
                      </span>
                    </div>
                    <ChevronIcon 
                      className="w-5 h-5"
                      style={{ color: 'var(--text-muted)' }}
                    />
                  </button>

                  {/* Bookmarks */}
                  <button 
                    className="w-full flex items-center justify-between p-5 rounded-[var(--radius-lg)] transition-all hover:shadow-md"
                    style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}
                  >
                    <div className="flex items-center gap-4">
                      <div 
                        className="w-10 h-10 rounded-lg flex items-center justify-center"
                        style={{ background: 'var(--accent-teal-light)' }}
                      >
                        <BookMarked className="w-5 h-5 text-[var(--accent-teal)]" />
                      </div>
                      <span 
                        className="font-semibold text-base"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        {c.history.bookmarks}
                      </span>
                    </div>
                    <ChevronIcon 
                      className="w-5 h-5"
                      style={{ color: 'var(--text-muted)' }}
                    />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Logout */}
          <div 
            className="p-8"
            style={{ borderTop: '2px solid var(--border-color)' }}
          >
            <button 
              className="w-full py-4 px-6 rounded-[var(--radius-lg)] font-semibold flex items-center justify-center gap-3 transition-all hover:bg-red-50"
              style={{
                border: '2px solid rgba(198, 40, 40, 0.3)',
                color: 'var(--error)',
                background: 'transparent'
              }}
            >
              <LogOut className="w-5 h-5" />
              {c.logout}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
