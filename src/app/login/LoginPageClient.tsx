'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useI18n } from '@/lib/i18n/i18n-context';
import { useAuth } from '@/lib/auth/auth-context';
import { Feather } from 'lucide-react';
import { motion } from 'framer-motion';
import { useReducedMotion } from '@/lib/hooks';
import AuthPageShell from '@/features/auth/components/AuthPageShell';
import AuthPanel from '@/features/auth/components/AuthPanel';
import AuthTabs from '@/features/auth/components/AuthTabs';
import AuthFormLogin from '@/features/auth/components/AuthFormLogin';
import AuthFormSignup from '@/features/auth/components/AuthFormSignup';
import SocialButtonsRow from '@/features/auth/components/SocialButtonsRow';

function toErrorMessage(x: unknown, fallback: string): string {
    if (!x) return fallback;

    if (typeof x === "string") return x;
    if (x instanceof Error) return x.message || fallback;

    // Typical API error object cases
    if (typeof x === "object" && x !== null) {
        const obj = x as Record<string, unknown>;
        if (typeof obj.message === "string") return obj.message;
        if (typeof obj.error === "string") return obj.error;
        if (typeof obj.detail === "string") return obj.detail;

        // Some APIs return details as string/array/object
        if (typeof obj.details === "string") return obj.details;
        if (Array.isArray(obj.details)) {
            const first = obj.details.find((v: unknown) => typeof v === "string");
            if (typeof first === "string") return first;
        }
        if (obj.details && typeof obj.details === "object") {
            // try common FastAPI/Pydantic validation format
            const details = obj.details as Record<string, unknown>;
            const msg = details.msg ?? details.message;
            if (typeof msg === "string") return msg;
        }

        // last resort: stringify (but keep it short)
        try {
            return JSON.stringify(x);
        } catch {
            return fallback;
        }
    }

    return fallback;
}

export default function LoginPageClient() {
    const { language, dir } = useI18n();
    const { refresh: refreshAuth } = useAuth();
    const direction = dir;
    const router = useRouter();
    const searchParams = useSearchParams();
    const reducedMotion = useReducedMotion();

    // URL is the source of truth (no state, no effect)
    const activeTab: "login" | "signup" =
        searchParams?.get("tab") === "signup" ? "signup" : "login";

    // Login form state
    const [loginEmail, setLoginEmail] = useState("");
    const [loginPassword, setLoginPassword] = useState("");
    const [showLoginPassword, setShowLoginPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [isLoginLoading, setIsLoginLoading] = useState(false);
    const [loginError, setLoginError] = useState("");

    // Signup form state
    const [signupEmail, setSignupEmail] = useState("");
    const [signupPassword, setSignupPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showSignupPassword, setShowSignupPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isSignupLoading, setIsSignupLoading] = useState(false);
    const [signupError, setSignupError] = useState("");

    // OAuth callback errors: map known codes to safe messages only (never trust URL message param)
    const [oauthErrorToast, setOauthErrorToast] = useState<string | null>(null);
    const oauthErrorMessages: Record<string, string> = {
        email_exists: "This email is already registered with another sign-in method.",
        oauth_failed: "Sign-in failed. Please try again.",
        oauth_state_mismatch: "Sign-in session expired. Please try again.",
        oauth_denied: "Sign-in was cancelled.",
        oauth_no_code: "Sign-in did not complete. Please try again.",
        oauth_no_token: "Sign-in failed. Please try again.",
        oauth_config: "Sign-in is not configured. Please try another method.",
        oauth_exception: "Something went wrong. Please try again.",
    };
    useEffect(() => {
        const error = searchParams?.get("error");
        if (!error) return;
        const message = oauthErrorMessages[error] ?? "Sign-in failed. Please try again.";
        setOauthErrorToast(message);
        const base = searchParams?.get("tab") === "signup" ? "/login?tab=signup" : "/login";
        router.replace(base, { scroll: false });
    }, [searchParams, router]);

    const content = {
        en: {
            brandName: 'Rumi AI Agent',
            heroTitle: 'Welcome to Rumi AI Agent',
            heroSubtitle: 'Seek the wisdom of Rumi',
            loginTab: 'Log In',
            signupTab: 'Sign Up',
            // Login
            loginEmail: 'Email',
            loginEmailPlaceholder: 'Email',
            loginPassword: 'Password',
            loginPasswordPlaceholder: 'Password',
            rememberMe: 'Remember me',
            forgotPassword: 'Forgot password?',
            loginButton: 'Log In',
            loginError: 'Invalid email or password',
            // Signup
            signupEmail: 'Email',
            signupEmailPlaceholder: 'Email',
            signupPassword: 'Password',
            signupPasswordPlaceholder: 'Password',
            confirmPassword: 'Confirm Password',
            confirmPasswordPlaceholder: 'Confirm Password',
            passwordHint: 'At least 8 characters',
            signupButton: 'Sign Up',
            signupError: 'Please fill in all fields correctly',
            // Social
            orContinue: 'Or continue with',
            google: 'Google',
            kakao: 'Kakao',
            apple: 'Apple',
            appleComingSoon: 'This login method coming soon',
            // Footer
            noAccount: "Don't have an account?",
            signupLink: 'Sign up',
            hasAccount: 'Already have an account?',
            loginLink: 'Log in',
            // Footer links
            privacyPolicy: 'Privacy Policy',
            contactUs: 'Contact Us',
        },
        fa: {
            brandName: 'رومی هوش مصنوعی',
            heroTitle: 'به رومی هوش مصنوعی خوش آمدید',
            heroSubtitle: 'حکمت رومی را جستجو کنید',
            loginTab: 'ورود',
            signupTab: 'ثبت نام',
            loginEmail: 'ایمیل',
            loginEmailPlaceholder: 'ایمیل',
            loginPassword: 'رمز عبور',
            loginPasswordPlaceholder: 'رمز عبور',
            rememberMe: 'مرا به خاطر بسپار',
            forgotPassword: 'رمز عبور را فراموش کردید؟',
            loginButton: 'ورود',
            loginError: 'ایمیل یا رمز عبور نادرست',
            signupEmail: 'ایمیل',
            signupEmailPlaceholder: 'ایمیل',
            signupPassword: 'رمز عبور',
            signupPasswordPlaceholder: 'رمز عبور',
            confirmPassword: 'تأیید رمز عبور',
            confirmPasswordPlaceholder: 'تأیید رمز عبور',
            passwordHint: 'حداقل ۸ کاراکتر',
            signupButton: 'ثبت نام',
            signupError: 'لطفاً همه فیلدها را به درستی پر کنید',
            orContinue: 'یا ادامه با',
            google: 'گوگل',
            kakao: 'کاکائو',
            apple: 'اپل',
            appleComingSoon: 'این روش ورود به زودی',
            noAccount: 'حساب کاربری ندارید؟',
            signupLink: 'ثبت نام',
            hasAccount: 'قبلاً حساب دارید؟',
            loginLink: 'ورود',
            privacyPolicy: 'سیاست حفظ حریم خصوصی',
            contactUs: 'تماس با ما',
        },
        kr: {
            brandName: '루미 AI 에이전트',
            heroTitle: '루미 AI 에이전트에 오신 것을 환영합니다',
            heroSubtitle: '루미의 지혜를 찾아보세요',
            loginTab: '로그인',
            signupTab: '가입',
            loginEmail: '이메일',
            loginEmailPlaceholder: '이메일',
            loginPassword: '비밀번호',
            loginPasswordPlaceholder: '비밀번호',
            rememberMe: '로그인 상태 유지',
            forgotPassword: '비밀번호를 잊으셨나요?',
            loginButton: '로그인',
            loginError: '이메일 또는 비밀번호가 잘못되었습니다',
            signupEmail: '이메일',
            signupEmailPlaceholder: '이메일',
            signupPassword: '비밀번호',
            signupPasswordPlaceholder: '비밀번호',
            confirmPassword: '비밀번호 확인',
            confirmPasswordPlaceholder: '비밀번호 확인',
            passwordHint: '최소 8자',
            signupButton: '가입',
            signupError: '모든 필드를 올바르게 입력해주세요',
            orContinue: '또는 계속하기',
            google: 'Google',
            kakao: '카카오',
            apple: 'Apple',
            appleComingSoon: '이 로그인 방법은 곧 제공됩니다',
            noAccount: '계정이 없으신가요?',
            signupLink: '가입',
            hasAccount: '이미 계정이 있으신가요?',
            loginLink: '로그인',
            privacyPolicy: '개인정보 처리방침',
            contactUs: '문의하기',
        },
    };

    const c = content[language] || content.en;

    const handleLoginSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoginLoading(true);
        setLoginError('');

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: loginEmail, password: loginPassword }),
            });

            const data = await response.json().catch(() => null);

            if (!response.ok || !data?.success) {
                setLoginError(toErrorMessage(data, c.loginError));
                return;
            }

            // Refresh global auth state so Navbar updates immediately
            await refreshAuth();
            const next = searchParams?.get("next");
            const safeNext = next && next.startsWith("/") && !next.includes("//") ? next : "/chat";
            router.push(safeNext);
        } catch (error) {
            setLoginError(toErrorMessage(error, c.loginError));
        } finally {
            setIsLoginLoading(false);
        }
    };

    const handleSignupSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSignupLoading(true);
        setSignupError('');

        if (signupPassword !== confirmPassword) {
            setSignupError("Passwords do not match");
            setIsSignupLoading(false);
            return;
        }

        if (signupPassword.length < 8) {
            setSignupError("Password must be at least 8 characters");
            setIsSignupLoading(false);
            return;
        }

        try {
            const response = await fetch('/api/auth/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: signupEmail, password: signupPassword }),
            });

            const data = await response.json().catch(() => null);

            if (!response.ok || !data?.success) {
                setSignupError(toErrorMessage(data, c.signupError));
                return;
            }

            // Refresh global auth state so Navbar updates immediately
            await refreshAuth();
            const next = searchParams?.get("next");
            const safeNext = next && next.startsWith("/") && !next.includes("//") ? next : "/chat";
            router.push(safeNext);
        } catch (error) {
            setSignupError(toErrorMessage(error, c.signupError));
        } finally {
            setIsSignupLoading(false);
        }
    };

    const handleTabChange = (tab: "login" | "signup") => {
        const newUrl = tab === "signup" ? "/login?tab=signup" : "/login";
        router.replace(newUrl, { scroll: false });
        setLoginError('');
        setSignupError('');
    };


    return (
        <AuthPageShell>
            <div className="auth-content-wrapper" dir={direction}>
                {/* Hero Header - Brand Logo + Title */}
                <motion.div
                    className="auth-hero-content"
                    initial={reducedMotion ? {} : { opacity: 0, y: 20 }}
                    animate={reducedMotion ? {} : { opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                >
                    <Link href="/" className="auth-brand-link">
                        <Feather className="auth-brand-icon" />
                        <span className="auth-brand-text">{c.brandName}</span>
                    </Link>
                    <h1 className="auth-hero-title">{c.heroTitle}</h1>
                    <p className="auth-hero-subtitle">{c.heroSubtitle}</p>
                </motion.div>

                {/* Auth Panel */}
                <AuthPanel>
                    {/* Tabs */}
                    <AuthTabs
                        activeTab={activeTab}
                        onTabChange={handleTabChange}
                        loginLabel={c.loginTab}
                        signupLabel={c.signupTab}
                    />

                    {/* Form Content */}
                    <div className="auth-form-container">
                        {activeTab === 'login' ? (
                            <AuthFormLogin
                                email={loginEmail}
                                password={loginPassword}
                                showPassword={showLoginPassword}
                                rememberMe={rememberMe}
                                isLoading={isLoginLoading}
                                error={loginError}
                                onEmailChange={setLoginEmail}
                                onPasswordChange={setLoginPassword}
                                onShowPasswordToggle={() => setShowLoginPassword(!showLoginPassword)}
                                onRememberMeChange={setRememberMe}
                                onSubmit={handleLoginSubmit}
                                direction={direction}
                                content={{
                                    email: c.loginEmail,
                                    emailPlaceholder: c.loginEmailPlaceholder,
                                    password: c.loginPassword,
                                    passwordPlaceholder: c.loginPasswordPlaceholder,
                                    rememberMe: c.rememberMe,
                                    forgotPassword: c.forgotPassword,
                                    login: c.loginButton,
                                }}
                            />
                        ) : (
                            <AuthFormSignup
                                email={signupEmail}
                                password={signupPassword}
                                confirmPassword={confirmPassword}
                                showPassword={showSignupPassword}
                                showConfirmPassword={showConfirmPassword}
                                isLoading={isSignupLoading}
                                error={signupError}
                                onEmailChange={setSignupEmail}
                                onPasswordChange={setSignupPassword}
                                onConfirmPasswordChange={setConfirmPassword}
                                onShowPasswordToggle={() => setShowSignupPassword(!showSignupPassword)}
                                onShowConfirmPasswordToggle={() => setShowConfirmPassword(!showConfirmPassword)}
                                onSubmit={handleSignupSubmit}
                                direction={direction}
                                content={{
                                    email: c.signupEmail,
                                    emailPlaceholder: c.signupEmailPlaceholder,
                                    password: c.signupPassword,
                                    passwordPlaceholder: c.signupPasswordPlaceholder,
                                    confirmPassword: c.confirmPassword,
                                    confirmPasswordPlaceholder: c.confirmPasswordPlaceholder,
                                    passwordHint: c.passwordHint,
                                    signup: c.signupButton,
                                }}
                            />
                        )}
                    </div>

                    {/* Divider */}
                    <div className="auth-divider">
                        <div className="auth-divider-line" />
                        <span className="auth-divider-text">{c.orContinue}</span>
                        <div className="auth-divider-line" />
                    </div>

                    {/* Social Buttons */}
                    <SocialButtonsRow
                        googleLabel={c.google}
                        kakaoLabel={c.kakao}
                        appleLabel={c.apple}
                        appleComingSoon={c.appleComingSoon}
                        initialOAuthErrorToast={oauthErrorToast}
                    />

                    {/* Bottom Link */}
                    <div className="auth-bottom-link">
                        {activeTab === 'login' ? (
                            <p>
                                {c.noAccount}{' '}
                                <button
                                    type="button"
                                    onClick={() => handleTabChange('signup')}
                                    className="auth-switch-link"
                                >
                                    {c.signupLink}
                                </button>
                            </p>
                        ) : (
                            <p>
                                {c.hasAccount}{' '}
                                <button
                                    type="button"
                                    onClick={() => handleTabChange('login')}
                                    className="auth-switch-link"
                                >
                                    {c.loginLink}
                                </button>
                            </p>
                        )}
                    </div>
                </AuthPanel>

                {/* Footer Links */}
                <motion.div
                    className="auth-footer-links"
                    initial={reducedMotion ? {} : { opacity: 0 }}
                    animate={reducedMotion ? {} : { opacity: 1 }}
                    transition={{ delay: 0.4 }}
                >
                    <Link href="/privacy" className="auth-footer-link">
                        {c.privacyPolicy}
                    </Link>
                    <span className="auth-footer-separator">|</span>
                    <Link href="/contact" className="auth-footer-link">
                        {c.contactUs}
                    </Link>
                </motion.div>
            </div>
        </AuthPageShell>
    );
}