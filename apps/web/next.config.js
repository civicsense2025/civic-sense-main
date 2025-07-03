/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@civicsense/shared', '@civicsense/ui-web'],
  experimental: {
    serverActions: true,
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': __dirname,
      '@civicsense/ui-web': '../../packages/ui-web/src',
      '@civicsense/shared': '../../packages/shared/src'
    }
    return config
  }
}

module.exports = nextConfig 