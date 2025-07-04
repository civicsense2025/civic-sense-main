/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@civicsense/business-logic', '@civicsense/types'],
  experimental: {
    // Server actions are enabled by default in Next.js 14
    typedRoutes: true,
    serverComponentsExternalPackages: ['@supabase/supabase-js']
  }
}

module.exports = nextConfig 