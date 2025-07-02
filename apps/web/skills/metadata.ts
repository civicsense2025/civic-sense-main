import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Civic Skills | CivicSense',
  description: 'Develop practical civic skills to become a more informed and engaged citizen. Track your progress and master new abilities.',
  openGraph: {
    title: 'Civic Skills | CivicSense',
    description: 'Develop practical civic skills to become a more informed and engaged citizen. Track your progress and master new abilities.',
    type: 'website',
    images: [
      {
        url: '/images/CivicSense-Main-Share.png',
        width: 1200,
        height: 630,
        alt: 'CivicSense Skills',
      }
    ],
    siteName: 'CivicSense',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Civic Skills | CivicSense',
    description: 'Develop practical civic skills to become a more informed and engaged citizen. Track your progress and master new abilities.',
    creator: '@CivicSenseApp',
  },
}
