"use client"

import { supabase } from './supabase'
import type { Database } from './database.types'

// Types for premium features
export type SubscriptionTier = 'free' | 'premium' | 'pro'
export type SubscriptionStatus = 'active' | 'cancelled' | 'expired' | 'trial'
export type PremiumFeature = 
  | 'custom_decks' 
  | 'historical_progress' 
  | 'advanced_analytics' 
  | 'spaced_repetition' 
  | 'learning_insights'
  | 'priority_support'
  | 'offline_mode'
  | 'export_data'

export interface UserSubscription {
  id: string
  user_id: string
  subscription_tier: SubscriptionTier
  subscription_status: SubscriptionStatus
  subscription_start_date: string | null
  subscription_end_date: string | null
  trial_end_date: string | null
  payment_provider: string | null
  external_subscription_id: string | null
  last_payment_date: string | null
  next_billing_date: string | null
  billing_cycle: string | null
  amount_cents: number | null
  currency: string | null
  created_at: string | null
  updated_at: string | null
}

export interface FeatureLimits {
  tier: SubscriptionTier
  custom_decks_limit: number | null
  historical_months_limit: number
  advanced_analytics: boolean
  spaced_repetition: boolean
  learning_insights: boolean
  priority_support: boolean
  offline_mode: boolean
  export_data: boolean
}

export interface PremiumFeatureAccess {
  hasAccess: boolean
  tier: SubscriptionTier
  limits: FeatureLimits | null
  usageCount?: number
  monthlyLimit?: number | null
  resetDate?: string
}

// Stripe configuration
export const STRIPE_CONFIG = {
  publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
  priceIds: {
    premium_monthly: process.env.NEXT_PUBLIC_STRIPE_PREMIUM_MONTHLY_PRICE_ID || 'price_premium_monthly',
    premium_yearly: process.env.NEXT_PUBLIC_STRIPE_PREMIUM_YEARLY_PRICE_ID || 'price_1RZyUtG3ITPlpsLgGmypkdW4',
    premium_lifetime: process.env.NEXT_PUBLIC_STRIPE_PREMIUM_LIFETIME_PRICE_ID || 'price_1RZxDbG3ITPlpsLgh94UsB0J',
    pro_monthly: process.env.NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PRICE_ID || 'price_pro_monthly',
    pro_yearly: process.env.NEXT_PUBLIC_STRIPE_PRO_YEARLY_PRICE_ID || 'price_pro_yearly',
  },
  plans: {
    free: {
      name: 'Free',
      price: 0,
      features: [
        'Basic quiz access',
        '1 month progress history',
        'Basic achievements',
        'Community support'
      ],
      limits: {
        custom_decks: 0,
        historical_months: 1
      }
    },
    premium: {
      name: 'Premium',
      yearlyPrice: 25.00,
      lifetimePrice: 50.00,
      features: [
        'Unlimited quiz access',
        'Custom learning decks',
        'Advanced analytics',
        'Progress tracking',
        'Spaced repetition',
        'Learning insights',
        'Offline mode',
        'Data export',
        'Priority support'
      ],
      limits: {
        custom_decks: null,
        historical_months: null
      }
    }
  }
}

// =============================================================================
// SUBSCRIPTION OPERATIONS
// =============================================================================

export const subscriptionOperations = {
  /**
   * Get user's current subscription
   */
  async getUserSubscription(userId: string): Promise<UserSubscription | null> {
    const { data, error } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error) {
      console.error('Error fetching user subscription:', error)
      return null
    }

    return data as UserSubscription
  },

  /**
   * Create or update user subscription
   */
  async upsertSubscription(subscription: Partial<UserSubscription> & { user_id: string }): Promise<UserSubscription | null> {
    const { data, error } = await supabase
      .from('user_subscriptions')
      .upsert(subscription, { onConflict: 'user_id' })
      .select()
      .single()

    if (error) {
      console.error('Error upserting subscription:', error)
      return null
    }

    return data as UserSubscription
  },

  /**
   * Cancel user subscription
   */
  async cancelSubscription(userId: string): Promise<boolean> {
    const { error } = await supabase
      .from('user_subscriptions')
      .update({ 
        subscription_status: 'cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)

    if (error) {
      console.error('Error cancelling subscription:', error)
      return false
    }

    return true
  },

  /**
   * Get feature limits for user's tier
   */
  async getUserFeatureLimits(userId: string): Promise<FeatureLimits | null> {
    const { data, error } = await supabase
      .rpc('get_user_feature_limits', { p_user_id: userId })

    if (error) {
      console.error('Error fetching feature limits:', error)
      return null
    }

    return (data?.[0] as FeatureLimits) || null
  }
}

// =============================================================================
// PREMIUM FEATURE ACCESS
// =============================================================================

export const premiumFeatures = {
  /**
   * Check if user has access to a specific premium feature
   */
  async checkFeatureAccess(userId: string, feature: PremiumFeature): Promise<PremiumFeatureAccess> {
    try {
      // Get subscription and limits
      const [subscription, limits] = await Promise.all([
        subscriptionOperations.getUserSubscription(userId),
        subscriptionOperations.getUserFeatureLimits(userId)
      ])

      const tier = subscription?.subscription_tier || 'free'
      const hasAccess = await this.hasFeatureAccess(userId, feature)

      // Get usage data for features with limits
      let usageCount: number | undefined
      let monthlyLimit: number | null | undefined
      let resetDate: string | undefined

             if (feature === 'custom_decks' && limits) {
         const { data: usage } = await supabase
           .from('user_feature_usage')
           .select('usage_count, monthly_limit, reset_date')
           .eq('user_id', userId)
           .eq('feature_name', feature)
           .single()

         usageCount = usage?.usage_count || 0
         monthlyLimit = limits.custom_decks_limit
         resetDate = usage?.reset_date || undefined
       }

      return {
        hasAccess,
        tier,
        limits,
        usageCount,
        monthlyLimit,
        resetDate
      }
    } catch (error) {
      console.error('Error checking feature access:', error)
      return {
        hasAccess: false,
        tier: 'free',
        limits: null
      }
    }
  },

  /**
   * Check if user has access to a feature (using database function)
   */
  async hasFeatureAccess(userId: string, feature: PremiumFeature): Promise<boolean> {
    const { data, error } = await supabase
      .rpc('check_premium_feature_access', {
        p_user_id: userId,
        p_feature_name: feature
      })

    if (error) {
      console.error('Error checking premium feature access:', error)
      return false
    }

    return data || false
  },

  /**
   * Track feature usage
   */
  async trackFeatureUsage(userId: string, feature: PremiumFeature): Promise<boolean> {
    const { data, error } = await supabase
      .rpc('track_feature_usage', {
        p_user_id: userId,
        p_feature_name: feature
      })

    if (error) {
      console.error('Error tracking feature usage:', error)
      return false
    }

    return data || false
  },

  /**
   * Get all premium features access for user
   */
  async getAllFeatureAccess(userId: string): Promise<Record<PremiumFeature, boolean>> {
    const features: PremiumFeature[] = [
      'custom_decks',
      'historical_progress', 
      'advanced_analytics',
      'spaced_repetition',
      'learning_insights',
      'priority_support',
      'offline_mode',
      'export_data'
    ]

    const accessPromises = features.map(async (feature) => {
      const hasAccess = await this.hasFeatureAccess(userId, feature)
      return [feature, hasAccess] as const
    })

    const results = await Promise.all(accessPromises)
    
    return Object.fromEntries(results) as Record<PremiumFeature, boolean>
  }
}

// =============================================================================
// STRIPE INTEGRATION
// =============================================================================

export const stripeOperations = {
  /**
   * Create Stripe checkout session
   */
  async createCheckoutSession(
    userId: string,
    priceId: string,
    successUrl: string,
    cancelUrl: string,
    isUpgrade: boolean = false
  ): Promise<{ sessionId?: string; error?: string }> {
    try {
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          priceId,
          successUrl,
          cancelUrl,
          isUpgrade
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        return { error: data.error || 'Failed to create checkout session' }
      }

      return { sessionId: data.sessionId }
    } catch (error) {
      console.error('Error creating checkout session:', error)
      return { error: 'Network error' }
    }
  },

  /**
   * Create Stripe customer portal session
   */
  async createPortalSession(
    userId: string,
    returnUrl: string
  ): Promise<{ url: string | null; error: string | null }> {
    try {
      const response = await fetch('/api/stripe/create-portal-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          returnUrl
        })
      })

      const data = await response.json()

      if (!response.ok) {
        return { url: null, error: data.error || 'Failed to create portal session' }
      }

      return { url: data.url, error: null }
    } catch (error) {
      console.error('Error creating portal session:', error)
      return { url: null, error: 'Network error' }
    }
  },

  async createUpgradeSession(
    userId: string,
    fromTier: 'premium' | 'pro',
    toTier: 'lifetime',
    successUrl: string,
    cancelUrl: string
  ): Promise<{ sessionId?: string; error?: string }> {
    try {
      const response = await fetch('/api/stripe/create-upgrade-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          fromTier,
          toTier,
          successUrl,
          cancelUrl
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        return { error: data.error || 'Failed to create upgrade session' }
      }

      return { sessionId: data.sessionId }
    } catch (error) {
      console.error('Error creating upgrade session:', error)
      return { error: 'Network error' }
    }
  }
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

export const premiumUtils = {
  /**
   * Get tier display name
   */
  getTierDisplayName(tier: SubscriptionTier): string {
    const names = {
      free: 'Free',
      premium: 'Premium',
      pro: 'Pro'
    }
    return names[tier]
  },

  /**
   * Get tier color for UI
   */
  getTierColor(tier: SubscriptionTier): string {
    const colors = {
      free: 'text-slate-700 bg-slate-100 dark:bg-slate-800 dark:text-slate-200',
      premium: 'text-blue-600 bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400',
      pro: 'text-indigo-700 bg-indigo-100 dark:bg-indigo-900/20 dark:text-indigo-400'
    }
    return colors[tier]
  },

  /**
   * Check if subscription is active
   */
  isSubscriptionActive(subscription: UserSubscription | null): boolean {
    if (!subscription) return false
    
    const now = new Date()
    const endDate = subscription.subscription_end_date ? new Date(subscription.subscription_end_date) : null
    
    return subscription.subscription_status === 'active' && 
           (!endDate || endDate > now)
  },

  /**
   * Get days until subscription expires
   */
  getDaysUntilExpiry(subscription: UserSubscription | null): number | null {
    if (!subscription?.subscription_end_date) return null
    
    const now = new Date()
    const endDate = new Date(subscription.subscription_end_date)
    const diffTime = endDate.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    return diffDays > 0 ? diffDays : 0
  },

  /**
   * Format price for display
   */
  formatPrice(cents: number, currency: string = 'USD'): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(cents / 100)
  },

  /**
   * Check if email address is from an educational institution (.edu domain)
   */
  isEducationalEmail(email: string): boolean {
    if (!email || typeof email !== 'string') return false
    
    // Convert to lowercase for case-insensitive comparison
    const normalizedEmail = email.toLowerCase().trim()
    
    // Check for .edu domain
    return normalizedEmail.endsWith('.edu')
  },

  /**
   * Extract domain from email address
   */
  getEmailDomain(email: string): string | null {
    if (!email || typeof email !== 'string') return null
    
    const atIndex = email.lastIndexOf('@')
    if (atIndex === -1) return null
    
    return email.substring(atIndex + 1).toLowerCase().trim()
  }
}

// =============================================================================
// EDUCATIONAL ACCESS OPERATIONS
// =============================================================================

export const educationalAccess = {
  /**
   * Automatically grant premium access to users with confirmed .edu email addresses
   */
  async grantEducationalPremium(userId: string, userEmail: string): Promise<boolean> {
    try {
      // Check if email is from educational institution
      if (!premiumUtils.isEducationalEmail(userEmail)) {
        return false
      }

      // Check if user already has a subscription
      const existingSubscription = await subscriptionOperations.getUserSubscription(userId)
      
      // Don't override existing paid subscriptions
      if (existingSubscription && 
          existingSubscription.subscription_status === 'active' && 
          existingSubscription.payment_provider === 'stripe') {
        console.log(`User ${userId} already has paid subscription, skipping educational access`)
        return false
      }

      // Create educational premium subscription
      const educationalSubscription = {
        user_id: userId,
        subscription_tier: 'premium' as SubscriptionTier,
        subscription_status: 'active' as SubscriptionStatus,
        subscription_start_date: new Date().toISOString(),
        subscription_end_date: null, // Lifetime for .edu
        trial_end_date: null,
        payment_provider: 'educational',
        external_subscription_id: `edu_${userId}_${Date.now()}`,
        last_payment_date: null,
        next_billing_date: null,
        billing_cycle: 'educational',
        amount_cents: 0,
        currency: 'USD',
        updated_at: new Date().toISOString()
      }

      const result = await subscriptionOperations.upsertSubscription(educationalSubscription)
      
      if (result) {
        console.log(`Educational premium access granted to ${userEmail} (${userId})`)
        return true
      } else {
        console.error(`Failed to grant educational access to ${userId}`)
        return false
      }
    } catch (error) {
      console.error('Error granting educational premium access:', error)
      return false
    }
  },

  /**
   * Check if user's subscription is educational
   */
  isEducationalSubscription(subscription: UserSubscription | null): boolean {
    return subscription?.payment_provider === 'educational' || 
           subscription?.billing_cycle === 'educational'
  },

  /**
   * Get educational subscription status message
   */
  getEducationalStatusMessage(userEmail: string): string {
    const domain = premiumUtils.getEmailDomain(userEmail)
    return `Educational access granted for ${domain}. You have lifetime premium access as a student or faculty member.`
  },

  /**
   * Process new user signup for educational access
   */
  async processNewUserEducationalAccess(userId: string, userEmail: string, emailConfirmed: boolean = false): Promise<void> {
    try {
      // Only grant access if email is confirmed
      if (!emailConfirmed) {
        console.log(`Email not confirmed for ${userEmail}, skipping educational access check`)
        return
      }

      // Check if this is an educational email and grant access
      const granted = await this.grantEducationalPremium(userId, userEmail)
      
      if (granted) {
        console.log(`Educational premium access automatically granted to ${userEmail}`)
        
        // Optional: You could also trigger a welcome email or notification here
        // await sendEducationalWelcomeEmail(userEmail)
      }
    } catch (error) {
      console.error('Error processing educational access for new user:', error)
    }
  }
} 