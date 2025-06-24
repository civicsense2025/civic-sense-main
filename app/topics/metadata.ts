import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Daily Topics • CivicSense',
  description: 'Explore our curated collection of daily topics about American politics, news, and government. Browse by list or calendar view.',
  keywords: ['daily topics', 'civic education', 'politics', 'government', 'current events'],
  authors: [
    {
      name: 'CivicSense Team',
      url: 'https://civicsense.com'
    }
  ],
  creator: 'CivicSense',
  publisher: 'CivicSense',
  alternates: {
    canonical: '/topics'
  },
  openGraph: {
    title: 'Daily Topics • CivicSense',
    description: 'Explore our curated collection of daily topics about American politics, news, and government.',
    url: '/topics',
    siteName: 'CivicSense',
    type: 'website',
    images: [
      {
        url: '/images/CivicSense-Main-Share.png',
        width: 1200,
        height: 630,
        alt: 'CivicSense Daily Topics'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Daily Topics • CivicSense',
    description: 'Explore our curated collection of daily topics about American politics, news, and government.',
    images: ['/images/CivicSense-Main-Share.png'],
    creator: '@CivicSenseApp'
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
  }
} 