import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Free 2025 Civics Test | How Well Do You Really Know Today\'s Politics?',
  description: 'Think you understand how American government actually works? Take our free 10-minute civics test covering 2025 politics, current events, and real-world scenarios. Get instant results—no signup required.',
  keywords: [
    'civics test 2025',
    'political knowledge test',
    'government quiz 2025', 
    'citizenship test',
    'civic education',
    'democracy quiz',
    'constitutional knowledge',
    'political literacy test',
    'current events quiz 2025',
    'government assessment',
    'civic knowledge test',
    'political awareness quiz',
    'democracy education',
    'civic engagement test',
    'modern civics test',
    'how government works',
    'political understanding quiz'
  ],
  openGraph: {
    title: 'Free 2025 Civics Test | Test Your Political Knowledge',
    description: 'Think you know how American politics really works? Take our free 10-minute test covering today\'s government, current events, and real scenarios. Get instant results.',
    type: 'website',
    url: 'https://civicsense.one/civics-test',
    images: [
      {
        url: '/placeholder.jpg',
        width: 1200,
        height: 630,
        alt: 'Free 2025 Civics Test - Test Your Knowledge of Today\'s Politics and Government',
      }
    ],
    siteName: 'CivicSense',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Free 2025 Civics Test | How Well Do You Know Today\'s Politics?',
    description: 'Think you understand how government works? Take our free 10-minute civics test and find out. No signup required.',
    creator: '@CivicSenseApp',
    images: ['/placeholder.jpg'],
  },
  alternates: {
    canonical: 'https://civicsense.one/civics-test',
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
  other: {
    'application-ld+json': JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'EducationalOccupationalCredential',
      name: '2025 Comprehensive Civics Knowledge Test',
      description: 'A modern assessment of civic knowledge covering current government, politics, and democratic participation in 2025',
      provider: {
        '@type': 'Organization',
        name: 'CivicSense',
        url: 'https://civicsense.one'
      },
      educationalLevel: 'All Levels',
      competencyRequired: 'Basic reading comprehension',
      credentialCategory: 'Assessment',
      dateCreated: '2025',
      about: [
        {
          '@type': 'Thing',
          name: 'Civic Education'
        },
        {
          '@type': 'Thing', 
          name: 'Government Knowledge'
        },
        {
          '@type': 'Thing',
          name: 'Political Literacy'
        },
        {
          '@type': 'Thing',
          name: 'Current Events'
        }
      ]
    })
  }
} 