'use client';

interface AuthTabsProps {
  activeTab: 'login' | 'signup';
  onTabChange: (tab: 'login' | 'signup') => void;
  loginLabel: string;
  signupLabel: string;
}

export default function AuthTabs({ activeTab, onTabChange, loginLabel, signupLabel }: AuthTabsProps) {
  return (
    <div className="auth-tabs" role="tablist">
      <button
        type="button"
        onClick={() => onTabChange('login')}
        className={`auth-tab ${activeTab === 'login' ? 'auth-tab-active' : ''}`}
        role="tab"
        aria-selected={activeTab === 'login'}
        aria-controls="auth-form-content"
      >
        {loginLabel}
      </button>
      <button
        type="button"
        onClick={() => onTabChange('signup')}
        className={`auth-tab ${activeTab === 'signup' ? 'auth-tab-active' : ''}`}
        role="tab"
        aria-selected={activeTab === 'signup'}
        aria-controls="auth-form-content"
      >
        {signupLabel}
      </button>
    </div>
  );
}
