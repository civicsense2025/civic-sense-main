"use client"

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/components/auth/auth-provider'
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
    export_data: false
  })

  // Load subscription data
  const loadSubscriptionData = useCallback(async () => {
    if (!user) {
      setSubscription(null)
      setLimits(null)
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    try {
      const [subscriptionData, limitsData, accessData] = await Promise.all([
        subscriptionOperations.getUserSubscription(user.id),
        subscriptionOperations.getUserFeatureLimits(user.id),
        premiumFeatures.getAllFeatureAccess(user.id)
      ])

      setSubscription(subscriptionData)
      setLimits(limitsData)
      setFeatureAccess(accessData)
    } catch (error) {
      console.error('Error loading subscription data:', error)
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
    return featureAccess[feature] || false
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
  const isActive = premiumUtils.isSubscriptionActive(subscription)
  const isPremium = (subscription?.subscription_tier === 'premium' || subscription?.subscription_tier === 'pro') && isActive
  const isPro = subscription?.subscription_tier === 'pro' && isActive
  const daysUntilExpiry = premiumUtils.getDaysUntilExpiry(subscription)

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
        console.error('Error opening customer portal:', error)
        return
      }

      if (url) {
        window.location.href = url
      }
    } catch (error) {
      console.error('Error opening customer portal:', error)
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