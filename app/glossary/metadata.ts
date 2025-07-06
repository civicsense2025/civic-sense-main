import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Civic Glossary | CivicSense',
  description: 'Explore our comprehensive glossary of civic terms, political concepts, and government terminology to enhance your understanding.',
  openGraph: {
    title: 'Civic Glossary | CivicSense',
    description: 'Explore our comprehensive glossary of civic terms, political concepts, and government terminology to enhance your understanding.',
    type: 'website',
    images: [
      {
        url: '/placeholder.jpg',
        width: 1200,
        height: 630,
        alt: 'CivicSense Glossary',
      }
    ],
    siteName: 'CivicSense',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Civic Glossary | CivicSense',
    description: 'Explore our comprehensive glossary of civic terms, political concepts, and government terminology to enhance your understanding.',
    creator: '@CivicSenseApp',
  },
}
