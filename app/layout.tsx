import type React from "react"
import type { Metadata, Viewport } from "next"
import { Space_Mono } from "next/font/google"
import "./globals.css"
import "../styles/accessibility.css"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/components/auth/auth-provider"
import { AccessibilityProvider } from "@/components/accessibility/accessibility-provider"
import { StatsigProvider } from "@/components/providers/statsig-provider"
import { PWAProvider } from "@/components/providers/pwa-provider"
import { LanguageProvider } from "@/components/providers/language-provider"
import { ConnectionProvider } from "@/components/providers/connection-provider"
import { Toaster } from "@/components/ui/toaster"
import { Footer } from "@/components/ui/footer"
import { GlobalAudioWrapper } from "@/components/client-global-audio-wrapper"
import { Analytics } from "@vercel/analytics/react"
import { SpeedInsights } from "@vercel/speed-insights/next"
import { PWAStatus } from "@/components/pwa-status"
import { DebugSettingsPanel } from "@/components/debug-settings-panel"
import { cn } from '@/lib/utils'

// Import cache debug utilities in development
if (process.env.NODE_ENV === 'development') {
  import('@/lib/cache-debug').then(() => {
    console.log('Cache debugging loaded')
  }).catch(err => {
    console.warn('Failed to load cache debugging:', err)
  })
}

const spaceMono = Space_Mono({
  weight: ['400', '700'],
  subsets: ['latin'],
  variable: '--font-space-mono',
})

const getBaseUrl = () => {
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL
  return 'http://localhost:3000'
}

export const metadata: Metadata = {
  title: {
    template: '%s | CivicSense',
    default: 'CivicSense - Learn Civics Through Current Events',
  },
  description: 'Learn civics through current events. Stay informed and understand how democracy works.',
  metadataBase: new URL('https://civicsense.org'),
  manifest: "/manifest.json",
  applicationName: "CivicSense",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "CivicSense",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    siteName: "CivicSense",
    title: "CivicSense - Civic Education Made Simple",
    description: "Transform from passive citizen to informed, confident democratic participant with daily civic education.",
    images: [
      {
        url: "/images/CivicSense-Main-Share.png",
        width: 1200,
        height: 630,
        alt: "CivicSense - Civic Education Made Simple",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "CivicSense - Civic Education Made Simple",
    description: "Transform from passive citizen to informed, confident democratic participant with daily civic education.",
    images: ["/images/CivicSense-Main-Share.png"],
  },
  keywords: [
    "civic education",
    "democracy",
    "government",
    "civics",
    "citizenship",
    "political education",
    "quiz",
    "learning"
  ],
  authors: [{ name: "CivicSense" }],
  creator: "CivicSense",
  publisher: "CivicSense",
  icons: {
    icon: [
      { url: "/icons/icon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/icons/icon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/icon-72x72.png", sizes: "72x72", type: "image/png" },
      { url: "/icons/icon-96x96.png", sizes: "96x96", type: "image/png" },
      { url: "/icons/icon-128x128.png", sizes: "128x128", type: "image/png" },
      { url: "/icons/icon-144x144.png", sizes: "144x144", type: "image/png" },
      { url: "/icons/icon-152x152.png", sizes: "152x152", type: "image/png" },
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-384x384.png", sizes: "384x384", type: "image/png" },
      { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icons/icon-180x180.png", sizes: "180x180", type: "image/png" },
    ],
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: '#0f172a' },
  ],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Essential icons only */}
        <link rel="icon" type="image/png" sizes="32x32" href="/icons/icon-32x32.png" />
        <link rel="apple-touch-icon" href="/icons/icon-180x180.png" />
        
        {/* PWA meta tags */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        
        {/* Preload critical resources only */}
        <link rel="preload" href="/icons/icon-32x32.png" as="image" type="image/png" />
        <link rel="preload" href="/icons/icon-180x180.png" as="image" type="image/png" />
      </head>
      <body className={cn(
        'min-h-screen bg-background font-sans antialiased',
        spaceMono.variable
      )}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <LanguageProvider>
            <AuthProvider>
              <AccessibilityProvider>
                <StatsigProvider>
                  <PWAProvider>
                    <ConnectionProvider>
                      {/* Skip link for keyboard users */}
                      <a href="#main-content" className="skip-link">
                        Skip to main content
                      </a>
                      <div className="min-h-screen flex flex-col w-full">
                        <main id="main-content" className="flex-1 w-full">
                          {children}
                        </main>
                        <Footer />
                      </div>
                      <Toaster />
                      <GlobalAudioWrapper />
                      <Analytics />
                      <SpeedInsights />
                      {process.env.NODE_ENV === 'development' && <PWAStatus />}
                      <DebugSettingsPanel />
                    </ConnectionProvider>
                  </PWAProvider>
                </StatsigProvider>
              </AccessibilityProvider>
            </AuthProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
