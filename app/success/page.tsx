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
  const { subscription, refreshSubscription, isPremium } = usePremium()
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
    // Elegant, minimal confetti - matches our design philosophy
    confetti({
      particleCount: 30,
      spread: 45,
      origin: { y: 0.8 },
      colors: ['#64748b', '#94a3b8', '#cbd5e1'],
      gravity: 0.6,
      scalar: 0.8
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

  // Check if user already has premium and redirect
  useEffect(() => {
    if (!sessionId && subscription && isPremium) {
      // User already has premium and is accessing success page directly
      setTimeout(() => {
        router.push('/dashboard')
      }, 3000) // Redirect after 3 seconds
    }
  }, [sessionId, subscription, isPremium, router])

  if (cancelled) {
    return (
      <main className="min-h-screen bg-slate-50 dark:bg-slate-950">
        <div className="container py-24">
          <div className="max-w-2xl mx-auto text-center space-y-12">
            <div className="space-y-6">
              <h1 className="text-5xl font-light text-slate-900 dark:text-white tracking-tight">
                No worries
              </h1>
              <p className="text-xl text-slate-500 dark:text-slate-400 font-light leading-relaxed">
                You can upgrade to premium anytime when you're ready.
              </p>
            </div>
            
            <Button 
              onClick={handleContinueToQuizzes}
              className="bg-slate-900 hover:bg-slate-800 dark:bg-slate-50 dark:hover:bg-slate-200 dark:text-slate-900 text-white font-medium rounded-full px-8 py-4 h-auto text-lg"
            >
              Continue Learning
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </main>
    )
  }

  if (isLoading) {
    return (
      <main className="min-h-screen bg-slate-50 dark:bg-slate-950">
        <div className="container py-24">
          <div className="max-w-2xl mx-auto text-center space-y-8">
            <div className="w-8 h-8 border-2 border-slate-200 border-t-slate-900 dark:border-slate-700 dark:border-t-slate-50 rounded-full animate-spin mx-auto"></div>
            <p className="text-lg text-slate-500 dark:text-slate-400 font-light">
              Confirming your subscription...
            </p>
          </div>
        </div>
      </main>
    )
  }

  const details = getSubscriptionDetails()

  // Handle users who already have premium (prevent refresh abuse)
  if (!sessionId && subscription && isPremium) {
    return (
      <main className="min-h-screen bg-slate-50 dark:bg-slate-950">
        <div className="container py-24">
          <div className="max-w-2xl mx-auto text-center space-y-12">
            <div className="space-y-6">
              <h1 className="text-5xl font-light text-slate-900 dark:text-white tracking-tight">
                You're already premium!
              </h1>
              <p className="text-xl text-slate-500 dark:text-slate-400 font-light leading-relaxed">
                You already have {subscription.subscription_tier} membership. Redirecting you to your dashboard...
              </p>
            </div>
            
            <div className="w-8 h-8 border-2 border-slate-200 border-t-slate-900 dark:border-slate-700 dark:border-t-slate-50 rounded-full animate-spin mx-auto"></div>
          </div>
        </div>
      </main>
    )
  }

  // Handle donation success
  if (type === 'donation') {
    return (
      <main className="min-h-screen bg-slate-50 dark:bg-slate-950">
        <div className="container py-24">
          <div className="max-w-3xl mx-auto text-center space-y-16">
            {/* Hero section */}
            <div className="space-y-8">
              <div className="text-8xl font-light">💝</div>
              <div className="space-y-4">
                <h1 className="text-6xl font-light text-slate-900 dark:text-white tracking-tight">
                  Thank You
                </h1>
                <p className="text-2xl text-slate-500 dark:text-slate-400 font-light leading-relaxed">
                  Your ${amount} donation helps us build civic education that politicians don't want you to have.
                </p>
              </div>
            </div>

                         {/* Impact section - clean single column layout */}
             <div className="space-y-8">
               <div className="text-center space-y-2">
                 <div className="text-3xl font-light text-slate-900 dark:text-white">
                   Fact-checked
                 </div>
                 <div className="text-lg text-slate-500 dark:text-slate-400 font-light leading-relaxed">
                   Supporting verified civic education
                 </div>
               </div>
               
               <div className="text-center space-y-2">
                 <div className="text-3xl font-light text-slate-900 dark:text-white">
                   Informed
                 </div>
                 <div className="text-lg text-slate-500 dark:text-slate-400 font-light leading-relaxed">
                   Helping citizens make better decisions
                 </div>
               </div>
               
               <div className="text-center space-y-2">
                 <div className="text-3xl font-light text-slate-900 dark:text-white">
                   Independent
                 </div>
                 <div className="text-lg text-slate-500 dark:text-slate-400 font-light leading-relaxed">
                   Platform improvements and new features
                 </div>
               </div>
               
               <div className="text-center space-y-2">
                 <div className="text-3xl font-light text-slate-900 dark:text-white">
                   Democratic
                 </div>
                 <div className="text-lg text-slate-500 dark:text-slate-400 font-light leading-relaxed">
                   Strengthening civic participation
                 </div>
               </div>
             </div>

            {/* Action section */}
            <div className="space-y-6">
              <Button 
                onClick={handleContinueToQuizzes}
                className="bg-slate-900 hover:bg-slate-800 dark:bg-slate-50 dark:hover:bg-slate-200 dark:text-slate-900 text-white font-medium rounded-full px-8 py-4 h-auto text-lg"
              >
                Continue Learning
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              
              <p className="text-lg text-slate-500 dark:text-slate-400 font-light">
                Share CivicSense with friends to multiply your impact
              </p>
            </div>
          </div>
        </div>
      </main>
    )
  }

    return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="container py-24">
        <div className="max-w-7xl mx-auto space-y-16">
          {/* Hero section */}
          <div className="text-center space-y-8">
            <div className="text-8xl font-light">🎉</div>
            <div className="space-y-4">
              <h1 className="text-6xl font-light text-slate-900 dark:text-white tracking-tight">
                Welcome to Premium
              </h1>
              <p className="text-2xl text-slate-500 dark:text-slate-400 font-light leading-relaxed">
                Your payment was successful. You now have access to all premium features.
              </p>
            </div>
          </div>

          {/* Two column layout: Subscription details + Features */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24">
            {/* Left column: Subscription details */}
            <div className="space-y-12">
              <div className="space-y-8">
                <h2 className="text-3xl font-light text-slate-900 dark:text-white tracking-tight">
                  Confirmation
                </h2>
                
                {details && (
                  <div className="space-y-6">
                    <div className="space-y-1">
                      <div className="text-sm uppercase tracking-widest text-slate-400 dark:text-slate-500 font-medium">
                        Plan
                      </div>
                      <div className="text-2xl font-light text-slate-900 dark:text-white">
                        Premium {details.isLifetime ? 'Lifetime' : 'Yearly'}
                      </div>
                    </div>
                    
                    {details.amount && (
                      <div className="space-y-1">
                        <div className="text-sm uppercase tracking-widest text-slate-400 dark:text-slate-500 font-medium">
                          Amount
                        </div>
                        <div className="text-2xl font-light text-slate-900 dark:text-white">
                          {details.amount} {details.isLifetime ? 'one-time' : '/year'}
                        </div>
                      </div>
                    )}
                    
                    <div className="space-y-1">
                      <div className="text-sm uppercase tracking-widest text-slate-400 dark:text-slate-500 font-medium">
                        Status
                      </div>
                      <div className="text-2xl font-light text-slate-900 dark:text-white">
                        Active
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <div className="space-y-6">
                <Button 
                  onClick={handleContinueToQuizzes}
                  className="group w-full bg-slate-900 hover:bg-slate-800 dark:bg-slate-50 dark:hover:bg-slate-200 dark:text-slate-900 text-white font-medium rounded-full px-8 py-4 h-auto text-lg transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5"
                >
                  <span className="group-hover:mr-1 transition-all duration-300">Start Learning</span>
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
                </Button>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Button 
                    variant="outline" 
                    onClick={handleViewDashboard}
                    className="border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-600 text-slate-700 dark:text-slate-300 font-medium rounded-full px-6 py-3 h-auto"
                  >
                    <BarChart3 className="mr-2 h-4 w-4" />
                    View Analytics
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    onClick={handleManageSubscription}
                    className="border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-600 text-slate-700 dark:text-slate-300 font-medium rounded-full px-6 py-3 h-auto"
                  >
                    Manage Account
                  </Button>
                </div>
              </div>
            </div>

            {/* Right column: Features */}
            <div className="space-y-12">
              <h2 className="text-3xl font-light text-slate-900 dark:text-white tracking-tight">
                What's included
              </h2>
              
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                <div className="py-8 first:pt-0 last:pb-0 space-y-3 group hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-colors duration-300 rounded-lg px-6 -mx-6">
                  <div className="text-2xl font-light text-slate-900 dark:text-white group-hover:text-slate-700 dark:group-hover:text-slate-200 transition-colors duration-300">
                    Unlimited custom learning decks
                  </div>
                  <div className="text-lg text-slate-500 dark:text-slate-400 font-light leading-relaxed">
                    Create personalized quizzes on any civic topic
                  </div>
                </div>
                
                <div className="py-8 space-y-3 group hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-colors duration-300 rounded-lg px-6 -mx-6">
                  <div className="text-2xl font-light text-slate-900 dark:text-white group-hover:text-slate-700 dark:group-hover:text-slate-200 transition-colors duration-300">
                    Advanced analytics and insights
                  </div>
                  <div className="text-lg text-slate-500 dark:text-slate-400 font-light leading-relaxed">
                    Track your progress and identify knowledge gaps
                  </div>
                </div>
                
                <div className="py-8 space-y-3 group hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-colors duration-300 rounded-lg px-6 -mx-6">
                  <div className="text-2xl font-light text-slate-900 dark:text-white group-hover:text-slate-700 dark:group-hover:text-slate-200 transition-colors duration-300">
                    Complete progress history
                  </div>
                  <div className="text-lg text-slate-500 dark:text-slate-400 font-light leading-relaxed">
                    View your entire learning journey
                  </div>
                </div>
                
                <div className="py-8 space-y-3 group hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-colors duration-300 rounded-lg px-6 -mx-6">
                  <div className="text-2xl font-light text-slate-900 dark:text-white group-hover:text-slate-700 dark:group-hover:text-slate-200 transition-colors duration-300">
                    Spaced repetition learning
                  </div>
                  <div className="text-lg text-slate-500 dark:text-slate-400 font-light leading-relaxed">
                    Scientifically optimized review scheduling
                  </div>
                </div>
                
                <div className="py-8 space-y-3 group hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-colors duration-300 rounded-lg px-6 -mx-6">
                  <div className="text-2xl font-light text-slate-900 dark:text-white group-hover:text-slate-700 dark:group-hover:text-slate-200 transition-colors duration-300">
                    Data export capabilities
                  </div>
                  <div className="text-lg text-slate-500 dark:text-slate-400 font-light leading-relaxed">
                    Download your data and progress reports
                  </div>
                </div>
                
                <div className="py-8 last:pb-0 space-y-3 group hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-colors duration-300 rounded-lg px-6 -mx-6">
                  <div className="text-2xl font-light text-slate-900 dark:text-white group-hover:text-slate-700 dark:group-hover:text-slate-200 transition-colors duration-300">
                    Priority support access
                  </div>
                  <div className="text-lg text-slate-500 dark:text-slate-400 font-light leading-relaxed">
                    Get help faster when you need it
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer message */}
          <div className="text-center pt-16">
            <p className="text-lg text-slate-500 dark:text-slate-400 font-light leading-relaxed">
              Thank you for supporting CivicSense.<br />
              Your subscription helps us create civic education that politicians don't want you to have.
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
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="container py-24">
        <div className="max-w-2xl mx-auto text-center space-y-8">
          <div className="w-8 h-8 border-2 border-slate-200 border-t-slate-900 dark:border-slate-700 dark:border-t-slate-50 rounded-full animate-spin mx-auto"></div>
          <p className="text-lg text-slate-500 dark:text-slate-400 font-light">
            Loading payment details...
          </p>
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