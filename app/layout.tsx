import type React from "react"
import type { Metadata } from "next"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/components/auth/auth-provider"
import { Toaster } from "@/components/ui/toaster"
import { Footer } from "@/components/ui/footer"
import { GlobalAudioControls } from '@/components/global-audio-controls'

export const metadata: Metadata = {
  title: "CivicSense",
  description: "Your daily dose of news vs. noise",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
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
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
