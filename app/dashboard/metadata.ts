import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Your Dashboard | CivicSense',
  description: 'Track your civic knowledge progress, view your quiz history, and manage your learning journey.',
  openGraph: {
    title: 'Your Dashboard | CivicSense',
    description: 'Track your civic knowledge progress, view your quiz history, and manage your learning journey.',
    type: 'website',
    images: [
      {
        url: '/placeholder.jpg',
        width: 1200,
        height: 630,
        alt: 'CivicSense Dashboard',
      }
    ],
    siteName: 'CivicSense',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Your Dashboard | CivicSense',
    description: 'Track your civic knowledge progress, view your quiz history, and manage your learning journey.',
    creator: '@CivicSenseApp',
  },
}
