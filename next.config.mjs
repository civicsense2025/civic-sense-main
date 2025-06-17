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
}

export default nextConfig