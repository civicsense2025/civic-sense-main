import type React from "react"
import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/components/auth/auth-provider"
import { StatsigProvider } from "@/components/providers/statsig-provider"
import { PWAProvider } from "@/components/providers/pwa-provider"
import { Toaster } from "@/components/ui/toaster"
import { Footer } from "@/components/ui/footer"
import { GlobalAudioWrapper } from "@/components/client-global-audio-wrapper"
import { Analytics } from "@vercel/analytics/next"
import { PWAStatus } from "@/components/pwa-status"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "CivicSense - Civic Education Made Simple",
  description: "Transform from passive citizen to informed, confident democratic participant with daily civic education.",
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
      { url: "/icons/apple-icon-180.png", sizes: "180x180", type: "image/png" },
    ],
  },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: "#1e40af",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" type="image/png" sizes="16x16" href="/icons/icon-16x16.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/icons/icon-32x32.png" />
        <link rel="apple-touch-icon" href="/icons/apple-icon-180.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
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
              <PWAProvider>
                <div className="min-h-screen flex flex-col">
                  <main className="flex-1">
                    {children}
                  </main>
                  <div className="mt-8">
                    <Footer />
                  </div>
                </div>
                <Toaster />
                <GlobalAudioWrapper />
                <Analytics />
                <PWAStatus />
              </PWAProvider>
            </StatsigProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
