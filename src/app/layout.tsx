import type { Metadata } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import '@fontsource/vazirmatn/400.css';
import '@fontsource/vazirmatn/500.css';
import '@fontsource/vazirmatn/700.css';
import './globals.css';
import { I18nProvider } from '@/lib/i18n/i18n-context';
import { ThemeProvider } from '@/lib/theme/theme-context';
import { AuthProvider } from '@/lib/auth/auth-context';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import Background from '@/components/ui/Background';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Rumi AI Agent - Digital Spiritual Companion',
  description: 'AI wisdom inspired by the poetry of Rumi. Get guidance and practical advice grounded in timeless Persian poetry.',
  keywords: ['Rumi', 'AI', 'Poetry', 'Spiritual', 'Wisdom', 'Persian', 'Masnavi'],
  authors: [{ name: 'Rumi AI Team' }],
  openGraph: {
    title: 'Rumi AI Agent - Digital Spiritual Companion',
    description: 'AI wisdom inspired by the poetry of Rumi.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Blocking script: set data-theme before first paint to avoid flash */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('rumi-theme');if(t==='dark')document.documentElement.setAttribute('data-theme','dark');}catch(e){}})();`,
          }}
        />
      </head>
      <body className={`${inter.variable} ${playfair.variable}`}>
        <ThemeProvider>
          <I18nProvider>
            <AuthProvider>
              <Background />
              <a href="#main-content" className="skip-link">
                Skip to content
              </a>
              <a href="#chat-input" className="skip-link" style={{ left: '140px' }}>
                Skip to chat
              </a>
              <Navbar />
              <main id="main-content">{children}</main>
              <Footer />
            </AuthProvider>
          </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
