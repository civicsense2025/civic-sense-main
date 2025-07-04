import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Public Figures | CivicSense',
  description: 'Learn about key public figures in politics and government. Explore their backgrounds, positions, and impacts on civic issues.',
  openGraph: {
    title: 'Public Figures | CivicSense',
    description: 'Learn about key public figures in politics and government. Explore their backgrounds, positions, and impacts on civic issues.',
    type: 'website',
    images: [
      {
        url: '/placeholder.jpg',
        width: 1200,
        height: 630,
        alt: 'CivicSense Public Figures',
      }
    ],
    siteName: 'CivicSense',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Public Figures | CivicSense',
    description: 'Learn about key public figures in politics and government. Explore their backgrounds, positions, and impacts on civic issues.',
    creator: '@CivicSenseApp',
  },
}
