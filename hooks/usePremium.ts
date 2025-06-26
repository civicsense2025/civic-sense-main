"use client"

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/components/auth/auth-provider'
import { debug } from '@/lib/debug-config'
import { 
  premiumFeatures, 
  subscriptionOperations,
  type PremiumFeature,
  type UserSubscription,
  type FeatureLimits,
  type PremiumFeatureAccess,
  premiumUtils
} from '@/lib/premium'

interface UsePremiumReturn {
  // Subscription state
  subscription: UserSubscription | null
  limits: FeatureLimits | null
  isLoading: boolean
  
  // Feature access
  hasFeatureAccess: (feature: PremiumFeature) => boolean
  checkFeatureAccess: (feature: PremiumFeature) => Promise<PremiumFeatureAccess>
  trackFeatureUsage: (feature: PremiumFeature) => Promise<boolean>
  
  // Subscription utilities
  isActive: boolean
  isPremium: boolean
  isPro: boolean
  daysUntilExpiry: number | null
  
  // Actions
  refreshSubscription: () => Promise<void>
  openCustomerPortal: () => Promise<void>
}

// ============================================================================
// OPTIMIZED IN-MEMORY CACHE TO PREVENT DUPLICATE NETWORK REQUESTS
// This avoids fetching the same subscription information multiple times when
// many components call usePremium(). Implements proper caching and request deduplication.
// ============================================================================

type CacheEntry = {
  subscription: UserSubscription | null
  limits: FeatureLimits | null
  featureAccess: Record<PremiumFeature, boolean>
  fetchedAt: number
}

// Cache keyed by userId (undefined for guests)
const subscriptionCache: Map<string | undefined, CacheEntry> = new Map()

// Cache validity duration (in milliseconds) – 5 minutes
const CACHE_TTL = 5 * 60 * 1000

// Request deduplication - prevent multiple simultaneous requests for same user
const activeRequests: Map<string | undefined, Promise<CacheEntry>> = new Map()

// Helper to check if cache entry is valid
const isCacheValid = (entry: CacheEntry): boolean => {
  return Date.now() - entry.fetchedAt < CACHE_TTL
}

// Helper to get cached data if valid
const getCachedData = (userId: string | undefined): CacheEntry | null => {
  const cached = subscriptionCache.get(userId)
  return cached && isCacheValid(cached) ? cached : null
}

export function usePremium(): UsePremiumReturn {
  const { user } = useAuth()
  const [subscription, setSubscription] = useState<UserSubscription | null>(null)
  const [limits, setLimits] = useState<FeatureLimits | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [featureAccess, setFeatureAccess] = useState<Record<PremiumFeature, boolean>>({
    custom_decks: false,
    historical_progress: false,
    advanced_analytics: false,
    spaced_repetition: false,
    learning_insights: false,
    priority_support: false,
    offline_mode: false,
    export_data: false,
    npc_battle: false
  })

  // Optimized subscription data loader with minimal API calls
  const loadSubscriptionData = useCallback(async () => {
    if (!user) {
      setSubscription(null)
      setLimits(null)
      setFeatureAccess({
        custom_decks: false,
        historical_progress: false,
        advanced_analytics: false,
        spaced_repetition: false,
        learning_insights: false,
        priority_support: false,
        offline_mode: false,
        export_data: false,
        npc_battle: false
      })
      setIsLoading(false)
      return
    }

    const cacheKey = user.id
    
    // Check if we have valid cached data
    const cachedData = getCachedData(cacheKey)
    if (cachedData) {
      debug.log('premium', '💾 Using cached subscription data for user:', user.id)
      setSubscription(cachedData.subscription)
      setLimits(cachedData.limits)
      setFeatureAccess(cachedData.featureAccess)
      setIsLoading(false)
      return
    }

    // Check if there's already an active request for this user
    const existingRequest = activeRequests.get(cacheKey)
    if (existingRequest) {
      debug.log('premium', '⏳ Reusing existing request for user:', user.id)
      try {
        const data = await existingRequest
        setSubscription(data.subscription)
        setLimits(data.limits)
        setFeatureAccess(data.featureAccess)
        setIsLoading(false)
        return
      } catch (error) {
        debug.error('premium', 'Error waiting for existing request:', error)
      }
    }

    setIsLoading(true)

    // Create new request and cache it to prevent duplicates
    const dataRequest = (async (): Promise<CacheEntry> => {
      try {
        debug.log('premium', '🔄 Loading subscription data with minimal API calls for user:', user.id)
        
        // Only load subscription and limits - derive feature access from subscription
        const [subscriptionData, limitsData] = await Promise.all([
          subscriptionOperations.getUserSubscription(user.id),
          subscriptionOperations.getUserFeatureLimits(user.id)
        ])

        // Calculate feature access locally to avoid 9 separate API calls
        const isPremiumOrPro = subscriptionData?.subscription_tier === 'premium' || subscriptionData?.subscription_tier === 'pro'
        const isActive = subscriptionData?.subscription_status === 'active'
        const hasActivePremium = isPremiumOrPro && isActive

        const accessData: Record<PremiumFeature, boolean> = {
          custom_decks: hasActivePremium,
          historical_progress: hasActivePremium,
          advanced_analytics: hasActivePremium,
          spaced_repetition: hasActivePremium,
          learning_insights: hasActivePremium,
          priority_support: hasActivePremium,
          offline_mode: hasActivePremium,
          export_data: hasActivePremium,
          npc_battle: hasActivePremium
        }

        debug.log('premium', '📊 Subscription data loaded with local feature calculation:', {
          hasSubscription: !!subscriptionData,
          hasLimits: !!limitsData,
          tier: subscriptionData?.subscription_tier,
          status: subscriptionData?.subscription_status,
          hasActivePremium
        })

        const cacheEntry: CacheEntry = {
          subscription: subscriptionData,
          limits: limitsData,
          featureAccess: accessData,
          fetchedAt: Date.now()
        }

        // Update cache
        subscriptionCache.set(cacheKey, cacheEntry)
        
        return cacheEntry
      } finally {
        // Clean up active request
        activeRequests.delete(cacheKey)
      }
    })()

    // Store the request to prevent duplicates
    activeRequests.set(cacheKey, dataRequest)

    try {
      const data = await dataRequest
      setSubscription(data.subscription)
      setLimits(data.limits)
      setFeatureAccess(data.featureAccess)
    } catch (error) {
      debug.error('premium', 'Error loading subscription data:', error)
    } finally {
      setIsLoading(false)
    }
  }, [user])

  // Load data on mount and user change
  useEffect(() => {
    loadSubscriptionData()
  }, [loadSubscriptionData])

  // Feature access helpers
  const hasFeatureAccess = useCallback((feature: PremiumFeature): boolean => {
    const access = Boolean(featureAccess[feature])
    debug.log('premium', `🔍 Feature access check: ${feature} = ${access}`)
    return access
  }, [featureAccess])

  const checkFeatureAccess = useCallback(async (feature: PremiumFeature): Promise<PremiumFeatureAccess> => {
    if (!user) {
      return {
        hasAccess: false,
        tier: 'free',
        limits: null
      }
    }

    return await premiumFeatures.checkFeatureAccess(user.id, feature)
  }, [user])

  const trackFeatureUsage = useCallback(async (feature: PremiumFeature): Promise<boolean> => {
    if (!user) return false
    
    const success = await premiumFeatures.trackFeatureUsage(user.id, feature)
    
    // Refresh subscription data to get updated usage counts
    if (success) {
      await loadSubscriptionData()
    }
    
    return success
  }, [user, loadSubscriptionData])

  // Subscription utilities
  const isActive = subscription ? premiumUtils.isSubscriptionActive(subscription) : false
  const isPremium = subscription && (subscription.subscription_tier === 'premium' || subscription.subscription_tier === 'pro') && isActive
  const isPro = subscription?.subscription_tier === 'pro' && isActive
  const daysUntilExpiry = subscription ? premiumUtils.getDaysUntilExpiry(subscription) : null

  // Debug subscription status
  useEffect(() => {
    if (user) {
      debug.log('premium', '🔍 Current subscription status:', {
        userId: user.id,
        hasSubscription: !!subscription,
        tier: subscription?.subscription_tier,
        status: subscription?.subscription_status,
        endDate: subscription?.subscription_end_date,
        isActive,
        isPremium,
        isPro,
        featureAccess: Object.entries(featureAccess).filter(([, hasAccess]) => hasAccess === true).map(([feature]) => feature)
      })
    }
  }, [user, subscription, isActive, isPremium, isPro, featureAccess])

  // Actions
  const refreshSubscription = useCallback(async () => {
    await loadSubscriptionData()
  }, [loadSubscriptionData])

  const openCustomerPortal = useCallback(async () => {
    if (!user || !subscription) return

    try {
      const { url, error } = await import('@/lib/premium').then(m => 
        m.stripeOperations.createPortalSession(user.id, window.location.href)
      )

      if (error) {
        debug.error('premium', 'Error opening customer portal:', error)
        return
      }

      if (url) {
        window.location.href = url
      }
    } catch (error) {
      debug.error('premium', 'Error opening customer portal:', error)
    }
  }, [user, subscription])

  return {
    // Subscription state
    subscription,
    limits,
    isLoading,
    
    // Feature access
    hasFeatureAccess,
    checkFeatureAccess,
    trackFeatureUsage,
    
    // Subscription utilities
    isActive,
    isPremium,
    isPro,
    daysUntilExpiry,
    
    // Actions
    refreshSubscription,
    openCustomerPortal
  }
} 