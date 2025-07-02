import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'CivicSense for Schools | Secure Civic Education Platform',
  description: 'Bring civic education to your classroom with Google Classroom integration, FERPA/COPPA compliance, and comprehensive teacher controls. Built for K-12 schools.',
  keywords: ['civic education schools', 'Google Classroom integration', 'FERPA compliant', 'educational technology', 'teacher controls', 'learning pods'],
  authors: [
    {
      name: 'CivicSense Team',
      url: 'https://civicsense.com'
    }
  ],
  creator: 'CivicSense',
  publisher: 'CivicSense',
  alternates: {
    canonical: '/schools'
  },
  openGraph: {
    title: 'CivicSense for Schools | Secure Civic Education Platform',
    description: 'FERPA/COPPA compliant civic education with Google Classroom integration, teacher controls, and learning pods designed for K-12 schools.',
    url: '/schools',
    siteName: 'CivicSense',
    type: 'website',
    images: [
      {
        url: '/images/CivicSense-Main-Share.png',
        width: 1200,
        height: 630,
        alt: 'CivicSense for Schools - Secure Civic Education Platform'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CivicSense for Schools | Secure Civic Education',
    description: 'FERPA/COPPA compliant civic education platform built for K-12 schools with teacher controls and Google Classroom integration.',
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