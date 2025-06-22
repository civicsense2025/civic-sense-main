/**
 * Debug utility for feature flags
 * Use this to diagnose issues with feature flags
 */

import { envFeatureFlags } from './env-feature-flags'

export function debugFeatureFlags() {
  console.group('🏁 Feature Flags Debug')
  
  // Environment info
  console.log('Environment:', {
    NODE_ENV: process.env.NODE_ENV,
    VERCEL_ENV: process.env.VERCEL_ENV,
    isDev: process.env.NODE_ENV === 'development',
    isProd: process.env.VERCEL_ENV === 'production' || process.env.NODE_ENV === 'production',
    isPreview: process.env.VERCEL_ENV === 'preview'
  })
  
  // Get all flags
  const allFlags = envFeatureFlags.getAllFlags()
  
  // Navigation flags
  console.group('📱 Navigation Flags')
  const navFlags = envFeatureFlags.getNavigationFlags()
  Object.entries(navFlags).forEach(([key, value]) => {
    const envKey = `NEXT_PUBLIC_FEATURE_${key.toUpperCase()}`
    const envValue = process.env[envKey]
    console.log(`${key}:`, {
      value,
      envKey,
      envValue,
      source: envValue !== undefined ? 'env' : 'default'
    })
  })
  console.groupEnd()
  
  // Core flags
  console.group('⚙️ Core Flags')
  const coreFlags = envFeatureFlags.getCoreFlags()
  Object.entries(coreFlags).forEach(([key, value]) => {
    const envKey = `NEXT_PUBLIC_FEATURE_${key.toUpperCase()}`
    const envValue = process.env[envKey]
    console.log(`${key}:`, {
      value,
      envKey,
      envValue,
      source: envValue !== undefined ? 'env' : 'default'
    })
  })
  console.groupEnd()
  
  // Premium flags
  console.group('👑 Premium Flags')
  const premiumFlags = envFeatureFlags.getPremiumFlags()
  Object.entries(premiumFlags).forEach(([key, value]) => {
    const envKey = `NEXT_PUBLIC_FEATURE_${key.toUpperCase()}`
    const envValue = process.env[envKey]
    console.log(`${key}:`, {
      value,
      envKey,
      envValue,
      source: envValue !== undefined ? 'env' : 'default'
    })
  })
  console.groupEnd()
  
  // Development overrides
  if (process.env.NODE_ENV === 'development') {
    console.group('🔧 Development Overrides')
    const overrides = envFeatureFlags.getOverrides()
    console.log('Active overrides:', overrides)
    console.groupEnd()
  }
  
  console.groupEnd()
}

// Make it available globally in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).debugFeatureFlags = debugFeatureFlags
}

export default debugFeatureFlags 