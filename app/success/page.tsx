"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/components/auth/auth-provider"
import { usePremium } from "@/hooks/usePremium"
import { Button } from "@/components/ui/button"
import { ArrowRight, Home, BarChart3 } from "lucide-react"
import Link from "next/link"
import confetti from "canvas-confetti"

function SuccessPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const { subscription, refreshSubscription } = usePremium()
  const [isLoading, setIsLoading] = useState(true)
  const [hasTriggeredConfetti, setHasTriggeredConfetti] = useState(false)

  const sessionId = searchParams.get('session_id')
  const cancelled = searchParams.get('cancelled')
  const type = searchParams.get('type')
  const amount = searchParams.get('amount')

  useEffect(() => {
    const loadData = async () => {
      if (user) {
        // Refresh subscription data to get the latest status
        await refreshSubscription()
      }
      setIsLoading(false)
    }

    loadData()
  }, [user, refreshSubscription])

  useEffect(() => {
    if (!isLoading && !cancelled && !hasTriggeredConfetti) {
      triggerConfetti()
      setHasTriggeredConfetti(true)
    }
  }, [isLoading, cancelled, hasTriggeredConfetti])

  const triggerConfetti = () => {
    // Simple, elegant confetti - not overwhelming
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.7 },
      colors: ['#64748b', '#94a3b8', '#cbd5e1']
    })
  }

  const getSubscriptionDetails = () => {
    if (!subscription) return null

    const isLifetime = subscription.billing_cycle === 'lifetime'
    const amount = subscription.amount_cents ? `$${(subscription.amount_cents / 100).toFixed(0)}` : null
    
    return {
      isLifetime,
      amount,
      tier: subscription.subscription_tier
    }
  }

  const handleContinueToQuizzes = () => {
    router.push('/')
  }

  const handleViewDashboard = () => {
    router.push('/dashboard')
  }

  const handleManageSubscription = () => {
    router.push('/settings')
  }

  if (cancelled) {
    return (
      <main className="min-h-screen bg-white dark:bg-slate-950">
        <div className="max-w-2xl mx-auto px-4 sm:px-8 py-16 sm:py-24">
          <div className="text-center">
            <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900 dark:text-slate-50 mb-4">
              Payment Cancelled
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mb-8">
              No worries! You can upgrade to premium anytime.
            </p>
            <Button 
              onClick={handleContinueToQuizzes}
              className="bg-slate-900 hover:bg-slate-800 dark:bg-slate-50 dark:hover:bg-slate-200 dark:text-slate-900"
            >
              Continue Learning
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </main>
    )
  }

  if (isLoading) {
    return (
      <main className="min-h-screen bg-white dark:bg-slate-950">
        <div className="max-w-2xl mx-auto px-4 sm:px-8 py-16 sm:py-24">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-slate-200 border-t-slate-900 dark:border-slate-700 dark:border-t-slate-50 mx-auto mb-4"></div>
            <p className="text-slate-600 dark:text-slate-400">Confirming your subscription...</p>
          </div>
        </div>
      </main>
    )
  }

  const details = getSubscriptionDetails()

  // Handle donation success
  if (type === 'donation') {
    return (
      <main className="min-h-screen bg-white dark:bg-slate-950">
        {/* Clean header */}
        <div className="border-b border-slate-100 dark:border-slate-900">
          <div className="max-w-4xl mx-auto px-4 sm:px-8 py-4">
            <Link 
              href="/" 
              className="group hover:opacity-70 transition-opacity"
            >
              <h1 className="text-xl sm:text-2xl font-semibold text-slate-900 dark:text-slate-50 tracking-tight">
                CivicSense
              </h1>
            </Link>
          </div>
        </div>

        {/* Donation success content */}
        <div className="max-w-2xl mx-auto px-4 sm:px-8 py-16 sm:py-24">
          <div className="text-center">
            {/* Success emoji */}
            <div className="mb-8">
              <div className="text-6xl">💝</div>
            </div>

            {/* Main message */}
            <h1 className="text-3xl sm:text-4xl font-semibold text-slate-900 dark:text-slate-50 mb-4 tracking-tight">
              Thank You!
            </h1>
            
            <p className="text-lg text-slate-600 dark:text-slate-400 mb-8">
              Your ${amount} donation helps us build a more informed society.
            </p>

            <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-6 mb-12 text-left">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-4 text-center">
                Your Impact
              </h2>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <span className="text-lg">🎯</span>
                  <span className="text-sm text-slate-700 dark:text-slate-300">Supporting fact-checked civic education</span>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-lg">🌐</span>
                  <span className="text-sm text-slate-700 dark:text-slate-300">Helping citizens make informed decisions</span>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-lg">🚀</span>
                  <span className="text-sm text-slate-700 dark:text-slate-300">Enabling platform improvements and new features</span>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-lg">🏛️</span>
                  <span className="text-sm text-slate-700 dark:text-slate-300">Strengthening democratic participation</span>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="space-y-4">
              <Button 
                onClick={handleContinueToQuizzes}
                className="w-full bg-slate-900 hover:bg-slate-800 dark:bg-slate-50 dark:hover:bg-slate-200 dark:text-slate-900"
              >
                Continue Learning
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Share CivicSense with friends to multiply your impact!
              </p>
            </div>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-white dark:bg-slate-950">
      {/* Clean header */}
      <div className="border-b border-slate-100 dark:border-slate-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-8 py-4">
          <Link 
            href="/" 
            className="group hover:opacity-70 transition-opacity"
          >
            <h1 className="text-xl sm:text-2xl font-semibold text-slate-900 dark:text-slate-50 tracking-tight">
              CivicSense
            </h1>
          </Link>
        </div>
      </div>

      {/* Main content with lots of whitespace */}
      <div className="max-w-2xl mx-auto px-4 sm:px-8 py-16 sm:py-24">
        <div className="text-center">
          {/* Success emoji */}
          <div className="mb-8">
            <div className="text-6xl">🎉</div>
          </div>

          {/* Main message */}
          <h1 className="text-3xl sm:text-4xl font-semibold text-slate-900 dark:text-slate-50 mb-4 tracking-tight">
            Welcome to Premium
          </h1>
          
          <p className="text-lg text-slate-600 dark:text-slate-400 mb-12">
            Your payment was successful. You now have access to all premium features.
          </p>

          {/* Subscription details - clean and minimal */}
          {details && (
            <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-6 mb-12 text-left">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-slate-900 dark:text-slate-50">Plan</span>
                  <span className="text-sm text-slate-600 dark:text-slate-400">
                    Premium {details.isLifetime ? 'Lifetime' : 'Yearly'}
                  </span>
                </div>
                {details.amount && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-slate-900 dark:text-slate-50">Amount</span>
                    <span className="text-sm text-slate-600 dark:text-slate-400">
                      {details.amount} {details.isLifetime ? 'one-time' : '/year'}
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-slate-900 dark:text-slate-50">Status</span>
                  <span className="text-sm text-slate-600 dark:text-slate-400">Active</span>
                </div>
              </div>
            </div>
          )}

          {/* What's included - simple list with checkmark emojis */}
          <div className="text-left mb-12">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-6 text-center">
              What's included
            </h2>
            <div className="space-y-3">
              {[
                'Unlimited custom learning decks',
                'Advanced analytics and insights',
                'Complete progress history',
                'Spaced repetition learning',
                'Data export capabilities',
                'Priority support'
              ].map((feature, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <span className="text-lg">✅</span>
                  <span className="text-sm text-slate-700 dark:text-slate-300">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Action buttons - clean and minimal */}
          <div className="space-y-4">
            <Button 
              onClick={handleContinueToQuizzes}
              className="w-full bg-slate-900 hover:bg-slate-800 dark:bg-slate-50 dark:hover:bg-slate-200 dark:text-slate-900"
            >
              Start Learning
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            
            <div className="flex space-x-4">
              <Button 
                variant="outline" 
                onClick={handleViewDashboard}
                className="flex-1 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900"
              >
                <BarChart3 className="mr-2 h-4 w-4" />
                View Analytics
              </Button>
              
              <Button 
                variant="outline" 
                onClick={handleManageSubscription}
                className="flex-1 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900"
              >
                Manage Account
              </Button>
            </div>
          </div>

          {/* Simple footer message */}
          <div className="mt-16 pt-8 border-t border-slate-100 dark:border-slate-900">
            <p className="text-sm text-slate-500 dark:text-slate-500">
              Thank you for supporting CivicSense. Your subscription helps us create better civic education content for everyone.
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}

// Loading fallback for Suspense
function LoadingFallback() {
  return (
    <main className="min-h-screen bg-white dark:bg-slate-950">
      <div className="max-w-2xl mx-auto px-4 sm:px-8 py-16 sm:py-24">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-slate-200 border-t-slate-900 dark:border-slate-700 dark:border-t-slate-50 mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Loading payment details...</p>
        </div>
      </div>
    </main>
  )
}

export default function SuccessPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <SuccessPageContent />
    </Suspense>
  )
} 