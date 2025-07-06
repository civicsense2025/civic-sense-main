import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'What\'s New in CivicSense | Updates & Features',
  description: 'Stay up to date with the latest civic education features, democratic learning tools, and improvements to CivicSense.',
  keywords: ['civic education updates', 'democracy tools', 'political learning', 'changelog', 'new features'],
  authors: [
    {
      name: 'CivicSense Team',
      url: 'https://civicsense.com'
    }
  ],
  creator: 'CivicSense',
  publisher: 'CivicSense',
  alternates: {
    canonical: '/changelog'
  },
  openGraph: {
    title: 'What\'s New in CivicSense | Latest Civic Education Features',
    description: 'Track the latest improvements to the civic education platform that reveals how power really works. Updates designed to make you harder to manipulate and impossible to fool.',
    url: '/changelog',
    siteName: 'CivicSense',
    type: 'website',
    images: [
      {
        url: '/images/CivicSense-Main-Share.png',
        width: 1200,
        height: 630,
        alt: 'CivicSense Changelog - Latest Civic Education Updates'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'What\'s New in CivicSense | Civic Education Updates',
    description: 'Latest features for the civic education that politicians don\'t want you to have.',
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
  },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION
  }
} 