import type React from "react"
import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/components/auth/auth-provider"
import { StatsigProvider } from "@/components/providers/statsig-provider"
import { Toaster } from "@/components/ui/toaster"
import { Footer } from "@/components/ui/footer"
import { GlobalAudioControls } from '@/components/global-audio-controls'
import { PWAPrompt, PWAStatus } from "@/components/pwa-prompt"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "CivicSense - Civic Education Made Simple",
  description: "Transform from passive citizen to informed, confident democratic participant with daily civic education.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "CivicSense",
  },
  openGraph: {
    type: "website",
    siteName: "CivicSense",
    title: "CivicSense - Civic Education Made Simple",
    description: "Transform from passive citizen to informed, confident democratic participant with daily civic education.",
  },
  twitter: {
    card: "summary_large_image",
    title: "CivicSense - Civic Education Made Simple",
    description: "Transform from passive citizen to informed, confident democratic participant with daily civic education.",
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
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/icons/icon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/icons/icon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icons/icon-180x180.png", sizes: "180x180", type: "image/png" },
    ],
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* PWA Meta Tags */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#1e40af" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="CivicSense" />
        <meta name="application-name" content="CivicSense" />
        <meta name="msapplication-TileColor" content="#1e40af" />
        <meta name="msapplication-tap-highlight" content="no" />
        
        {/* Apple Touch Icons */}
        <link rel="apple-touch-icon" href="/icons/icon-180x180.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icons/icon-152x152.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/icon-180x180.png" />
        <link rel="apple-touch-icon" sizes="167x167" href="/icons/icon-167x167.png" />
        
        {/* Favicons */}
        <link rel="icon" type="image/png" sizes="16x16" href="/icons/icon-16x16.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/icons/icon-32x32.png" />
        <link rel="shortcut icon" href="/favicon.ico" />
        
        {/* Splash Screens for iOS */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <link 
          rel="apple-touch-startup-image" 
          href="/icons/splash-2048x2732.png" 
          media="(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)" 
        />
        <link 
          rel="apple-touch-startup-image" 
          href="/icons/splash-1668x2224.png" 
          media="(device-width: 834px) and (device-height: 1112px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)" 
        />
        <link 
          rel="apple-touch-startup-image" 
          href="/icons/splash-1536x2048.png" 
          media="(device-width: 768px) and (device-height: 1024px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)" 
        />
        <link 
          rel="apple-touch-startup-image" 
          href="/icons/splash-1125x2436.png" 
          media="(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" 
        />
        <link 
          rel="apple-touch-startup-image" 
          href="/icons/splash-1242x2208.png" 
          media="(device-width: 414px) and (device-height: 736px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" 
        />
        <link 
          rel="apple-touch-startup-image" 
          href="/icons/splash-750x1334.png" 
          media="(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)" 
        />
        <link 
          rel="apple-touch-startup-image" 
          href="/icons/splash-640x1136.png" 
          media="(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)" 
        />
      </head>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <StatsigProvider>
              <div className="min-h-screen flex flex-col">
                <main className="flex-1">
                  {children}
                </main>
                <div className="mt-8">
                  <Footer />
                </div>
              </div>
              <Toaster />
              <GlobalAudioControls />
              <PWAPrompt />
              <PWAStatus />
            </StatsigProvider>
          </AuthProvider>
        </ThemeProvider>
        
        {/* Service Worker Registration */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js')
                    .then(function(registration) {
                      console.log('SW registered: ', registration);
                    })
                    .catch(function(registrationError) {
                      console.log('SW registration failed: ', registrationError);
                    });
                });
              }
            `,
          }}
        />
      </body>
    </html>
  )
}
