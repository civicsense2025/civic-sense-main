"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/auth/auth-provider"
import { usePremium } from '@civicsense/shared/usePremium'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { Button } from "../ui/button"
import { Badge } from "../ui/badge"
import { 
  isPremiumBadgesEnabled,
  isUpgradePromptsEnabled,
  isPremiumOnboardingEnabled,
  isBillingManagementEnabled
} from '@civicsense/shared/comprehensive-feature-flags'
import { Progress } from "../ui/progress"
import { Alert, AlertDescription } from "../ui/alert"
import { 
  Crown, Calendar, CreditCard, Settings, ExternalLink,
  CheckCircle, AlertCircle, Clock, Sparkles, Star,
  Download, BarChart3, BookOpen, Zap, Shield,
  ArrowRight, RefreshCw, Gift, Flame, GraduationCap
} from "lucide-react"
import { cn } from "../../utils"
import { 
  stripeOperations, 
  premiumUtils, 
  STRIPE_CONFIG,
  type UserSubscription,
  educationalAccess
} from '@civicsense/shared/premium'
import { PremiumFeaturesShowcase } from "@/components/premium-features-showcase"

interface PremiumSubscriptionCardProps {
  className?: string
}

export function PremiumSubscriptionCard({ className }: PremiumSubscriptionCardProps) {
  const { user } = useAuth()
  const { 
    subscription, 
    isPremium, 
    isActive, 
    daysUntilExpiry,
    refreshSubscription,
    openCustomerPortal,
    isLoading 
  } = usePremium()
  
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleRefreshSubscription = async () => {
    setIsRefreshing(true)
    await refreshSubscription()
    setIsRefreshing(false)
  }

  const handleManageBilling = async () => {
    if (!user || !subscription) return
    
    try {
      await openCustomerPortal()
    } catch (error) {
      console.error('Error opening customer portal:', error)
    }
  }

  const getSubscriptionStatusBadge = () => {
    if (!subscription) {
      return <Badge variant="outline" className="text-slate-600 border-slate-300">Free Plan</Badge>
    }

    const status = subscription.subscription_status
    const tier = subscription.subscription_tier
    const isEducational = educationalAccess.isEducationalSubscription(subscription)

    if (status === 'active') {
      if (tier === 'premium') {
        if (isEducational) {
          return <Badge className="bg-blue-600 dark:bg-blue-500 text-white border-0">
            <GraduationCap className="h-3 w-3 mr-1" />
            Educational Premium
          </Badge>
        } else if (subscription.billing_cycle === 'lifetime') {
          return <Badge className="bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 border-0">
            <Sparkles className="h-3 w-3 mr-1" />
            Premium Lifetime
          </Badge>
        } else {
          return <Badge className="bg-slate-700 dark:bg-slate-300 text-white dark:text-slate-900 border-0">
            <Crown className="h-3 w-3 mr-1" />
            Premium Yearly
          </Badge>
        }
      }
    }

    if (status === 'cancelled') {
      return <Badge variant="destructive">Cancelled</Badge>
    }

    if (status === 'expired') {
      return <Badge variant="secondary">Expired</Badge>
    }

    return <Badge variant="outline">{status}</Badge>
  }

  const getSubscriptionDetails = () => {
    if (!subscription) return null

    const isLifetime = subscription.billing_cycle === 'lifetime'
    const amount = subscription.amount_cents ? premiumUtils.formatPrice(subscription.amount_cents, subscription.currency || 'USD') : null
    const startDate = subscription.subscription_start_date ? new Date(subscription.subscription_start_date).toLocaleDateString() : null
    const endDate = subscription.subscription_end_date ? new Date(subscription.subscription_end_date).toLocaleDateString() : null
    const nextBilling = subscription.next_billing_date ? new Date(subscription.next_billing_date).toLocaleDateString() : null

    return {
      isLifetime,
      amount,
      startDate,
      endDate,
      nextBilling,
      billingCycle: subscription.billing_cycle,
      provider: subscription.payment_provider
    }
  }

  const details = getSubscriptionDetails()

  const getSubscriptionDescription = () => {
    if (!subscription) {
      return "Access basic features with limited usage"
    }

    const isEducational = educationalAccess.isEducationalSubscription(subscription)
    
    if (isEducational && user?.email) {
      return educationalAccess.getEducationalStatusMessage(user.email)
    }

    if (subscription.billing_cycle === 'lifetime') {
      return "You have lifetime access to all premium features"
    }

    if (subscription.subscription_tier === 'premium') {
      return "Access to all premium features with unlimited usage"
    }

    return "Active subscription with premium access"
  }

  const shouldShowBillingManagement = () => {
    // Don't show billing management for educational subscriptions
    return subscription && 
           !educationalAccess.isEducationalSubscription(subscription) &&
           subscription.billing_cycle !== 'lifetime' &&
           subscription.payment_provider === 'stripe'
  }

  const shouldShowUpgradeToLifetime = () => {
    // Don't show lifetime upgrade for educational users (they already have it)
    return isPremium && 
           subscription?.billing_cycle !== 'lifetime' && 
           !educationalAccess.isEducationalSubscription(subscription)
  }

  if (isLoading) {
    return (
      <Card className={cn("shadow-lg", className)}>
        <CardContent className="p-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-slate-200 border-t-slate-900 dark:border-slate-700 dark:border-t-slate-50"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={cn("space-y-8", className)}>
      {/* Upgrade to Lifetime Card - Only show to premium users who don't have lifetime or educational */}
      {isUpgradePromptsEnabled() && shouldShowUpgradeToLifetime() && (
        <Card className="border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Crown className="h-5 w-5 text-slate-700 dark:text-slate-300" />
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                    Upgrade to Lifetime Access
                  </h3>
                  <Badge className="bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs">
                    Most Popular
                  </Badge>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Switch to lifetime access for just $50 and never pay again. 
                  {subscription?.billing_cycle === 'yearly' && " You'll receive credit for your remaining subscription time."}
                </p>
              </div>
              <Button
                onClick={() => {
                  window.location.href = '/upgrade-to-lifetime'
                }}
                className="bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-slate-200 dark:text-slate-900 text-white"
              >
                <Zap className="h-4 w-4 mr-2" />
                Upgrade Now
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Subscription Card */}
      <Card className="shadow-lg border border-slate-200 dark:border-slate-700">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Subscription</CardTitle>
              <CardDescription className="text-slate-600 dark:text-slate-400">Manage your CivicSense subscription</CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              {isPremiumBadgesEnabled() && getSubscriptionStatusBadge()}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRefreshSubscription}
                disabled={isRefreshing}
                className="h-8 w-8 p-0"
              >
                <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Current Plan Overview */}
          <div className="p-6 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
            <div className="flex items-start justify-between">
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  {subscription ? `${premiumUtils.getTierDisplayName(subscription.subscription_tier)} Plan` : 'Free Plan'}
                </h3>
                
                {subscription && details ? (
                  <div className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                    {details.amount && (
                      <div className="flex items-center space-x-2">
                        <CreditCard className="h-4 w-4" />
                        <span>
                          {details.isLifetime 
                            ? `${details.amount} (one-time payment)` 
                            : `${details.amount}/${details.billingCycle}`
                          }
                        </span>
                      </div>
                    )}
                    
                    {details.startDate && (
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4" />
                        <span>Started: {details.startDate}</span>
                      </div>
                    )}
                    
                    {details.nextBilling && !details.isLifetime && (
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4" />
                        <span>Next billing: {details.nextBilling}</span>
                      </div>
                    )}
                    
                    {details.isLifetime && (
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-green-600 dark:text-green-400 font-medium">
                          Lifetime access - no recurring charges
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                    <div className="flex items-center space-x-2">
                      <Gift className="h-4 w-4" />
                      <span>No subscription required</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>Access to basic features</span>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="text-right">
                {subscription && details?.isLifetime ? (
                  <div className="text-2xl font-bold text-slate-700 dark:text-slate-300">
                    ∞
                  </div>
                ) : subscription && daysUntilExpiry !== null ? (
                  <div className="space-y-1">
                    <div className="text-2xl font-bold text-slate-700 dark:text-slate-300">
                      {daysUntilExpiry}
                    </div>
                    <div className="text-xs text-slate-500">days left</div>
                  </div>
                ) : (
                  <div className="text-2xl font-bold text-slate-400">
                    Free
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Expiry Warning */}
          {subscription && daysUntilExpiry !== null && daysUntilExpiry <= 7 && daysUntilExpiry > 0 && (
            <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800 dark:text-amber-200">
                Your subscription expires in {daysUntilExpiry} day{daysUntilExpiry !== 1 ? 's' : ''}. 
                {subscription.billing_cycle !== 'lifetime' && ' Manage your billing to avoid interruption.'}
              </AlertDescription>
            </Alert>
          )}

          {/* Educational Access Notice */}
          {subscription && educationalAccess.isEducationalSubscription(subscription) && user?.email && (
            <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <div className="flex items-start space-x-3">
                <GraduationCap className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <div className="space-y-2">
                  <h4 className="font-medium text-blue-900 dark:text-blue-100 text-sm">
                    Educational Access
                  </h4>
                  <p className="text-sm text-blue-700 dark:text-blue-300 leading-relaxed">
                    You have lifetime premium access as part of our educational program for {premiumUtils.getEmailDomain(user.email)} students and faculty.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Feature Access Overview */}
          <div className="space-y-4">
            <h4 className="font-semibold text-slate-900 dark:text-slate-100">Your Plan Includes</h4>
            
            <div className="grid grid-cols-1 gap-3">
              {subscription ? (
                // Premium features
                STRIPE_CONFIG.plans.premium.features.map((feature, index) => (
                  <div key={index} className="flex items-center space-x-3 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                    <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                    <span className="text-sm text-slate-700 dark:text-slate-300">{feature}</span>
                  </div>
                ))
              ) : (
                // Free features
                STRIPE_CONFIG.plans.free.features.map((feature, index) => (
                  <div key={index} className="flex items-center space-x-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                    <CheckCircle className="h-4 w-4 text-slate-500 flex-shrink-0" />
                    <span className="text-sm text-slate-700 dark:text-slate-300">{feature}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
            {isBillingManagementEnabled() && shouldShowBillingManagement() ? (
              <>
                <Button
                  onClick={handleManageBilling}
                  className="flex-1 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-slate-200 dark:text-slate-900 text-white"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Manage Billing
                  <ExternalLink className="h-4 w-4 ml-2" />
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => setShowUpgradeModal(true)}
                  className="flex-1 border-slate-300 dark:border-slate-600"
                >
                  <Crown className="h-4 w-4 mr-2" />
                  View Plans
                </Button>
              </>
            ) : subscription && (subscription.billing_cycle === 'lifetime' || educationalAccess.isEducationalSubscription(subscription)) ? (
              <div className="flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                <div className="text-center">
                  {educationalAccess.isEducationalSubscription(subscription) ? (
                    <>
                      <GraduationCap className="h-6 w-6 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                        Educational Premium Access
                      </p>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                        Lifetime access for students and faculty
                      </p>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-6 w-6 text-slate-600 dark:text-slate-400 mx-auto mb-2" />
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                        You have lifetime access to all premium features!
                      </p>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                        No further action needed
                      </p>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <Button
                onClick={() => setShowUpgradeModal(true)}
                className="w-full bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-slate-200 dark:text-slate-900 text-white"
              >
                <Crown className="h-4 w-4 mr-2" />
                Upgrade to Premium
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Plan Comparison for Free Users */}
      {!subscription && (
        <Card className="border-2 border-dashed border-slate-300 dark:border-slate-600">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Flame className="h-5 w-5 text-slate-600 dark:text-slate-400" />
              <span>Unlock Premium Features</span>
            </CardTitle>
            <CardDescription>
              See what you're missing with our premium plans
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="text-center p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <BookOpen className="h-8 w-8 text-slate-600 dark:text-slate-400 mx-auto mb-2" />
                <h4 className="font-semibold mb-1">Custom Decks</h4>
                <p className="text-xs text-slate-600 dark:text-slate-400">Create personalized study collections</p>
              </div>
              <div className="text-center p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <BarChart3 className="h-8 w-8 text-slate-600 dark:text-slate-400 mx-auto mb-2" />
                <h4 className="font-semibold mb-1">Advanced Analytics</h4>
                <p className="text-xs text-slate-600 dark:text-slate-400">Detailed performance insights</p>
              </div>
              <div className="text-center p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <Zap className="h-8 w-8 text-slate-600 dark:text-slate-400 mx-auto mb-2" />
                <h4 className="font-semibold mb-1">Spaced Repetition</h4>
                <p className="text-xs text-slate-600 dark:text-slate-400">Optimized learning schedule</p>
              </div>
            </div>
            
            <Button
              onClick={() => setShowUpgradeModal(true)}
              className="w-full bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-slate-200 dark:text-slate-900 text-white"
            >
              <Crown className="h-4 w-4 mr-2" />
              View All Premium Features
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-xl max-w-6xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Choose Your Plan</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowUpgradeModal(false)}
                  className="h-8 w-8 p-0"
                >
                  ×
                </Button>
              </div>
              <PremiumFeaturesShowcase onClose={() => setShowUpgradeModal(false)} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}