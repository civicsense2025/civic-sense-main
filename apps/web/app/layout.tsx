import React from "react"
import type { Metadata, Viewport } from "next"
import { Space_Mono } from "next/font/google"
import "./globals.css"
import "./fonts.css" 
import "../styles/accessibility.css"
import { ThemeProvider } from "@civicsense/ui-web/components/theme-provider"
import { AuthProvider } from "@civicsense/ui-web/components/auth/auth-provider"
// TEMPORARILY DISABLED: Has web dependencies during monorepo migration
// import { AccessibilityProvider } from "@civicsense/ui-web/components/accessibility/accessibility-provider"
import { StatsigProvider } from "@civicsense/ui-web/components/providers/statsig-provider"
import { PWAProvider } from "@civicsense/ui-web/components/providers/pwa-provider"
import { LanguageProvider } from "@civicsense/ui-web/components/providers/language-provider"
import { ConnectionProvider } from "@civicsense/ui-web/components/providers/connection-provider"
import { Toaster } from "@civicsense/ui-web"
import { Footer } from "@civicsense/ui-web"
import { GlobalAudioWrapper } from "@civicsense/ui-web/components/client-global-audio-wrapper"
import { Analytics } from "@vercel/analytics/react"
import { SpeedInsights } from "@vercel/speed-insights/next"
import { performanceMonitor } from "@civicsense/shared/lib/performance-monitor"
import { PWAStatus } from "@civicsense/ui-web/components/pwa-status"
import { DebugSettingsPanel } from "@civicsense/ui-web/components/debug-settings-panel"
import { cn } from '@civicsense/shared/lib/utils'

// Import cache debug utilities in development
if (process.env.NODE_ENV === 'development') {
  import('@civicsense/shared/lib/cache-debug').then(() => {
    console.log('Cache debugging loaded')
  }).catch(err => {
    console.warn('Failed to load cache debugging:', err)
  })
}

// ✅ Optimize font loading with font-display: swap to prevent FOUT
const spaceMono = Space_Mono({
  weight: ['400', '700'],
  subsets: ['latin'],
  variable: '--font-space-mono',
  display: 'swap', // Critical: Prevents invisible text during font swap period
  preload: true,
  fallback: ['Monaco', 'Menlo', 'Courier New', 'monospace'],
})

const getBaseUrl = () => {
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL
  return 'http://localhost:3000'
}

export const metadata: Metadata = {
  metadataBase: new URL(getBaseUrl()),
  title: {
    default: 'CivicSense | Democracy, Decoded Daily',
    template: '%s | CivicSense'
  },
  description: 'Transform yourself from passive observer to confident civic participant. Get the uncomfortable truths about how power really works in America.',
  keywords: ['civic education', 'democracy', 'politics', 'government', 'citizenship', 'voting'],
  authors: [{ name: 'CivicSense' }],
  creator: 'CivicSense',
  publisher: 'CivicSense',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: getBaseUrl(),
    siteName: 'CivicSense',
    title: 'CivicSense | Democracy, Decoded Daily',
    description: 'Transform yourself from passive observer to confident civic participant. Get the uncomfortable truths about how power really works in America.',
    images: [
      {
        url: '/api/generate-image?template=social-share&title=CivicSense&description=Democracy, Decoded Daily&type=platform',
        width: 1200,
        height: 630,
        alt: 'CivicSense - Democracy, Decoded Daily',
      }
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CivicSense | Democracy, Decoded Daily',
    description: 'Transform yourself from passive observer to confident civic participant. Get the uncomfortable truths about how power really works in America.',
    creator: '@CivicSenseApp',
    images: ['/api/generate-image?template=twitter-card&title=CivicSense&description=Democracy, Decoded Daily&type=platform'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    // Add when available: google: 'your-google-verification-code',
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: '#0f172a' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={spaceMono.variable}>
      <head>
        {/* ✅ Character encoding declaration - required for SEO */}
        <meta charSet="utf-8" />
        
        {/* ✅ DNS prefetch for external resources */}
        <link rel="dns-prefetch" href="//fonts.googleapis.com" />
        <link rel="dns-prefetch" href="//vercel-insights.com" />
        <link rel="dns-prefetch" href="//vercel-analytics.com" />
        <link rel="dns-prefetch" href="//supabase.com" />
        <link rel="dns-prefetch" href="//api.supabase.io" />
        
        {/* ✅ Preconnect for critical third-party origins */}
        <link rel="preconnect" href="https://fonts.googleapis.com" crossOrigin="" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        
        {/* Essential icons only - optimized */}
        <link rel="icon" type="image/png" sizes="32x32" href="/icons/icon-32x32.png" />
        <link rel="apple-touch-icon" href="/icons/icon-180x180.png" />
        
        {/* ✅ Critical CSS inlined to prevent render blocking */}
        <style dangerouslySetInnerHTML={{
          __html: `
            /* Critical above-the-fold styles */
            .skip-link {
              position: absolute;
              top: -40px;
              left: 6px;
              z-index: 100000;
              padding: 8px 16px;
              background: #1e3a8a;
              color: white;
              text-decoration: none;
              border-radius: 0 0 4px 4px;
              font-weight: 600;
              transition: top 0.3s;
            }
            .skip-link:focus {
              top: 0;
            }
            /* Prevent layout shift from font loading */
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            }
            .font-space-mono {
              font-family: var(--font-space-mono), Monaco, Menlo, "Courier New", monospace;
            }
            /* Prevent CLS from theme switching */
            html[style] {
              color-scheme: light dark;
            }
          `
        }} />
        
        {/* PWA meta tags */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="CivicSense" />
        
        {/* Performance monitoring initialization */}
        <script dangerouslySetInnerHTML={{
          __html: `
            // Initialize performance monitoring as early as possible
            (function() {
              if ('performance' in window && 'PerformanceObserver' in window) {
                // Track navigation timing
                window.addEventListener('load', function() {
                  const navEntry = performance.getEntriesByType('navigation')[0];
                  if (navEntry) {
                    console.log('🚀 Page loaded in ' + Math.round(navEntry.loadEventEnd - navEntry.fetchStart) + 'ms');
                  }
                });
              }
            })();
          `
        }} />

      </head>
      <body className={cn(
        'min-h-screen bg-background font-sans antialiased',
        'overflow-x-hidden w-full min-w-0', // Prevent horizontal overflow
        spaceMono.variable
      )}>
        {/* ✅ Optimized provider hierarchy - most critical first */}
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
          storageKey="civicsense-theme"
        >
          <LanguageProvider>
            <AuthProvider>
              {/* TEMPORARILY DISABLED: AccessibilityProvider has web dependencies during monorepo migration */}
              {/* <AccessibilityProvider> */}
                {/* ✅ Skip link for keyboard navigation (WCAG compliance) */}
                <a href="#main-content" className="skip-link">
                  Skip to main content
                </a>
                
                <div className="min-h-screen flex flex-col w-full">
                  <main id="main-content" className="flex-1 w-full">
                    {children}
                  </main>
                  <Footer />
                </div>
                
                {/* ✅ Non-critical providers loaded after main content */}
                <StatsigProvider>
                  <PWAProvider>
                    <ConnectionProvider>
                      <Toaster />
                      <GlobalAudioWrapper />
                      
                      {/* ✅ Analytics loaded last to not block rendering */}
                      <Analytics />
                      <SpeedInsights />
                      
                      {/* Development only components */}
                      {process.env.NODE_ENV === 'development' && (
                        <>
                          <PWAStatus />
                          <DebugSettingsPanel />
                        </>
                      )}
                    </ConnectionProvider>
                  </PWAProvider>
                </StatsigProvider>
              {/* </AccessibilityProvider> */}
            </AuthProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
