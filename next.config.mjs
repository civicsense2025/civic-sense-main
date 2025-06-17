/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  webpack: (config, { dev, isServer }) => {
    // Ignore warnings for specific modules
    config.ignoreWarnings = [
      /Critical dependency: the request of a dependency is an expression/,
      /Module not found: Can't resolve/,
    ]
    
    // Suppress warnings from specific modules
    config.stats = {
      ...config.stats,
      warnings: false,
      warningsFilter: [
        /node_modules\/@supabase\/realtime-js/,
        /Critical dependency: the request of a dependency is an expression/,
      ],
    }
    
    return config
  },
  async headers() {
    return [
      {
        // Prevent aggressive caching of CSS/JS to avoid stale design issues
        source: '/_next/static/css/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400, must-revalidate', // 1 day, must revalidate
          },
        ],
      },
      {
        source: '/_next/static/chunks/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400, must-revalidate', // 1 day, must revalidate
          },
        ],
      },
      {
        // Don't cache HTML pages to prevent stale content
        source: '/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
        ],
      },
    ]
  },
}

export default nextConfig