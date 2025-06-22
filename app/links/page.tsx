import { Suspense } from 'react'
import { Metadata } from 'next'
import { LinksPageClient } from './client'

export const metadata: Metadata = {
  title: 'CivicSense Links | Civic Education Resources',
  description: 'Access our latest civic education content, tools, and resources. Learn how power actually works in American democracy.',
  openGraph: {
    title: 'CivicSense Links | Civic Education Resources',
    description: 'Access our latest civic education content, tools, and resources. Learn how power actually works in American democracy.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CivicSense Links | Civic Education Resources',
    description: 'Access our latest civic education content, tools, and resources. Learn how power actually works in American democracy.',
  }
}

export default function LinksPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 dark:from-slate-950 dark:via-blue-950 dark:to-slate-900">
      <Suspense fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      }>
        <LinksPageClient />
      </Suspense>
    </div>
  )
} 