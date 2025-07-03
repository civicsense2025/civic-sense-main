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
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-slate-50/50 to-white">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    }>
      <LinksPageClient />
    </Suspense>
  )
} 