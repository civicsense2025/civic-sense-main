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
// SIMPLE IN-MEMORY CACHE TO PREVENT DUPLICATE NETWORK REQUESTS
// This avoids fetching the same subscription information multiple times when
// many components call usePremium(). A lightweight cache is sufficient because
// subscription data changes infrequently and can be refreshed manually.
// ============================================================================

type CacheEntry = {
  subscription: UserSubscription | null
  limits: FeatureLimits | null
  featureAccess: Record<PremiumFeature, boolean>
  fetchedAt: number
}

// Cache keyed by userId (undefined for guests)
const subscriptionCache: Map<string | undefined, CacheEntry> = new Map()

// Cache validity duration (in milliseconds) – 5 minutes is plenty
const CACHE_TTL = 5 * 60 * 1000

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

  // Load subscription data
  const loadSubscriptionData = useCallback(async () => {
    if (!user) {
      setSubscription(null)
      setLimits(null)
      setIsLoading(false)
      return
    }

    // Clear cache for this user to force fresh data
    const cacheKey = user?.id
    subscriptionCache.delete(cacheKey)

    setIsLoading(true)
    try {
      debug.log('premium', '🔄 Loading subscription data for user:', user.id)
      
      const [subscriptionData, limitsData, accessData] = await Promise.all([
        subscriptionOperations.getUserSubscription(user.id),
        subscriptionOperations.getUserFeatureLimits(user.id),
        premiumFeatures.getAllFeatureAccess(user.id)
      ])

      debug.log('premium', '📊 Subscription data loaded:', {
        hasSubscription: !!subscriptionData,
        subscription: subscriptionData,
        hasLimits: !!limitsData,
        limits: limitsData,
        accessData
      })

      setSubscription(subscriptionData)
      setLimits(limitsData)
      setFeatureAccess(accessData)

      // Update cache
      subscriptionCache.set(cacheKey, {
        subscription: subscriptionData,
        limits: limitsData,
        featureAccess: accessData,
        fetchedAt: Date.now()
      })
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
    const access = featureAccess[feature] || false
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
        featureAccess: Object.entries(featureAccess).filter(([, hasAccess]) => hasAccess).map(([feature]) => feature)
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