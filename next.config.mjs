import { createRequire } from 'module'
const require = createRequire(import.meta.url)

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  poweredByHeader: false,
  compress: true,
  reactStrictMode: true,
  images: {
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 86400,
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'i.ibb.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'api.dicebear.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'source.unsplash.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  experimental: {
    optimizePackageImports: ['@radix-ui/react-icons', 'lucide-react', '@supabase/supabase-js'],
    turbo: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
      },
    },
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  webpack: (config, { dev, isServer, webpack }) => {
    // Basic webpack configuration for compatibility
    config.ignoreWarnings = [
      /Critical dependency: the request of a dependency is an expression/,
      /Module not found: Can't resolve/,
    ]
    
    config.stats = {
      ...config.stats,
      warnings: false,
      warningsFilter: [
        /node_modules\/@supabase\/realtime-js/,
        /Critical dependency: the request of a dependency is an expression/,
      ],
    }

    // Exclude AI dependencies when building for Vercel
    if (process.env.DISABLE_AI_FEATURES === 'true') {
      config.externals = config.externals || []
      config.externals.push({
        '@anthropic-ai/sdk': 'commonjs @anthropic-ai/sdk',
        'openai': 'commonjs openai',
        '@google-cloud/text-to-speech': 'commonjs @google-cloud/text-to-speech',
        '@google-cloud/translate': 'commonjs @google-cloud/translate',
        'deepl-node': 'commonjs deepl-node'
      })

      // Ignore AI-related modules and admin routes
      config.plugins.push(
        new webpack.IgnorePlugin({
          resourceRegExp: /^(openai|@anthropic-ai\/sdk|@google-cloud\/(text-to-speech|translate)|deepl-node)$/,
        }),
        new webpack.IgnorePlugin({
          resourceRegExp: /\/admin\//,
        }),
        new webpack.IgnorePlugin({
          resourceRegExp: /\/ai\//,
        })
      )
    }
    
    // When AI features are disabled, ignore AI-related imports in API routes only
    if (process.env.DISABLE_AI_FEATURES === 'true' && isServer) {
      config.plugins.push(
        new webpack.IgnorePlugin({
          resourceRegExp: /^(openai|@anthropic-ai\/sdk|@google\/generative-ai|deepl-node)$/,
          contextRegExp: /app\/api\/(assistant|admin)/,
        })
      )
    }
    
    return config
  },
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [
          {
            type: 'host',
            value: 'civicsense.one',
          },
        ],
        destination: 'https://www.civicsense.one/:path*',
        permanent: true,
      },
    ]
  },
  async headers() {
    return [
      {
        source: '/_next/static/css/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/_next/static/chunks/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/_next/static/media/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/icons/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400',
          },
        ],
      },
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          },
        ],
      },
    ]
  },
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    NEXT_PUBLIC_STRIPE_PRICE_ID_MONTHLY: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_MONTHLY,
    NEXT_PUBLIC_STRIPE_PRICE_ID_YEARLY: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_YEARLY,
    NEXT_PUBLIC_STRIPE_PRICE_ID_LIFETIME: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_LIFETIME,
    NEXT_PUBLIC_STRIPE_PRODUCT_ID_LIFETIME: process.env.NEXT_PUBLIC_STRIPE_PRODUCT_ID_LIFETIME,
    NEXT_PUBLIC_STRIPE_PRICE_ID_DONATION_SMALL: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_DONATION_SMALL,
    NEXT_PUBLIC_STRIPE_PRICE_ID_DONATION_MEDIUM: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_DONATION_MEDIUM,
    NEXT_PUBLIC_STRIPE_PRICE_ID_DONATION_LARGE: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_DONATION_LARGE,
    NEXT_PUBLIC_STRIPE_PRICE_ID_DONATION_CUSTOM: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_DONATION_CUSTOM,
    NEXT_PUBLIC_STRIPE_PRICE_ID_GIFT_MONTHLY: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_GIFT_MONTHLY,
    NEXT_PUBLIC_STRIPE_PRICE_ID_GIFT_YEARLY: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_GIFT_YEARLY,
    NEXT_PUBLIC_STRIPE_PRICE_ID_GIFT_LIFETIME: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_GIFT_LIFETIME,
    NEXT_PUBLIC_STRIPE_PRICE_ID_CREDIT_PACK_SMALL: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_CREDIT_PACK_SMALL,
    NEXT_PUBLIC_STRIPE_PRICE_ID_CREDIT_PACK_MEDIUM: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_CREDIT_PACK_MEDIUM,
    NEXT_PUBLIC_STRIPE_PRICE_ID_CREDIT_PACK_LARGE: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_CREDIT_PACK_LARGE,
    NEXT_PUBLIC_STRIPE_PRICE_ID_CREDIT_PACK_HUGE: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_CREDIT_PACK_HUGE,
    NEXT_PUBLIC_STRIPE_PRICE_ID_CREDIT_PACK_MEGA: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_CREDIT_PACK_MEGA,
    NEXT_PUBLIC_STATSIG_CLIENT_SDK_KEY: process.env.NEXT_PUBLIC_STATSIG_CLIENT_SDK_KEY,
    NEXT_PUBLIC_MIXPANEL_TOKEN: process.env.NEXT_PUBLIC_MIXPANEL_TOKEN,
    NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
    NEXT_PUBLIC_SENTRY_ENVIRONMENT: process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT,
    NEXT_PUBLIC_APPLE_SHARED_SECRET: process.env.NEXT_PUBLIC_APPLE_SHARED_SECRET,
    NEXT_PUBLIC_APPLE_BUNDLE_ID: process.env.NEXT_PUBLIC_APPLE_BUNDLE_ID,
  },
}

export default nextConfig