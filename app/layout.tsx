import type React from "react"
import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/components/auth/auth-provider"
import { StatsigProvider } from "@/components/providers/statsig-provider"
import { Toaster } from "@/components/ui/toaster"
import { Footer } from "@/components/ui/footer"
import { GlobalAudioWrapper } from "@/components/client-global-audio-wrapper"
import { Analytics } from "@vercel/analytics/next"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "CivicSense - Civic Education Made Simple",
  description: "Transform from passive citizen to informed, confident democratic participant with daily civic education.",
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
    ],
  },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" type="image/png" sizes="16x16" href="/icons/icon-16x16.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/icons/icon-32x32.png" />
        <link rel="shortcut icon" href="/favicon.ico" />
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
              <GlobalAudioWrapper />
              <Analytics />
            </StatsigProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
