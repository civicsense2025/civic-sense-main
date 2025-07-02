import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Multiplayer Civic Learning | CivicSense',
  description: 'Join friends or meet new people in interactive civic knowledge games. Learn together, compete fairly, and build understanding with AI-powered learning companions.',
  openGraph: {
    title: '🎮 Multiplayer Civic Learning | CivicSense',
    description: 'Interactive civic knowledge games with friends and AI learning companions',
    type: 'website',
    images: [
      {
        url: '/placeholder.jpg',
        width: 1200,
        height: 630,
        alt: 'CivicSense Multiplayer Learning',
      }
    ],
    siteName: 'CivicSense',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: '🎮 Multiplayer Civic Learning',
    description: 'Learn civics together with friends and AI companions',
    creator: '@CivicSenseApp',
  },
} 