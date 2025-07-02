import { MetadataRoute } from 'next'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://civicsense.one'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/quiz/*',
          '/topics/*',
          '/categories',
          '/about',
          '/schools',
          '/changelog',
          '/collections/*',
          '/congress/*',
          '/glossary',
          '/multiplayer',
          '/civics-test',
          '/public-figures/*',
          '/skills/*',
          '/scenarios/*',
        ],
        disallow: [
          '/admin/*',
          '/api/*',
          '/dashboard/*',
          '/_next/*',
          '/.well-known/*',
          '/private/*',
        ],
      },
      {
        userAgent: 'GPTBot',
        disallow: '/',
      },
      {
        userAgent: 'Google-Extended',
        disallow: '/',
      },
      {
        userAgent: 'CCBot',
        disallow: '/',
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  }
} 