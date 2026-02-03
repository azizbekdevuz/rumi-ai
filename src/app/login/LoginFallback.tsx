'use client';

import AuthPageShell from "@/features/auth/components/AuthPageShell";

export default function LoginFallback() {
    return (
        <>
            <AuthPageShell>
                <div className="auth-content-wrapper">
                    <div className="auth-hero-content">
                        <div className="auth-page-loading">
                            <p className="auth-page-loading-text">Loading login page...</p>
                            <p className="auth-page-loading-text">
                                If the page is taking too long to load, refresh the page.
                            </p>
                            <button className="auth-submit-button" onClick={() => window.location.reload()}>
                                Refresh
                            </button>
                        </div>
                    </div>
                </div>
            </AuthPageShell>
        </>
    );
}