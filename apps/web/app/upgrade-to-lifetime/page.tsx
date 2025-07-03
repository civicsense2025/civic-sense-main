"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from '@civicsense/ui-web'
import { usePremium } from "@/hooks/usePremium"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@civicsense/ui-web'
import { Button } from '@civicsense/ui-web'
import { Badge } from '@civicsense/ui-web'
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Crown, Zap, Check, ArrowLeft, Sparkles, Shield, X } from "lucide-react"
import { stripeOperations } from "@/lib/premium"
import Link from "next/link"

export default function UpgradeToLifetimePage() {
  const router = useRouter()
  const { user } = useAuth()
  const { subscription, isPremium } = usePremium()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Redirect if not premium or already lifetime
  if (!user || !isPremium || subscription?.billing_cycle === 'lifetime') {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950 flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="p-8 text-center">
            <Shield className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Access Restricted</h2>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              This upgrade is only available to current Premium subscribers.
            </p>
            <Link href="/dashboard">
              <Button className="w-full">
                Go to Dashboard
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const handleUpgradeToLifetime = async () => {
    if (!user || !subscription) return

    setIsLoading(true)
    setError(null)

    try {
      const successUrl = `${window.location.origin}/success?upgrade=lifetime`
      const cancelUrl = window.location.href

      const { sessionId, error } = await stripeOperations.createUpgradeSession(
        user.id,
        'premium',
        'lifetime',
        successUrl,
        cancelUrl
      )

      if (error) {
        setError(error)
        return
      }

      if (sessionId) {
        // Simple redirect approach
        window.location.href = `https://checkout.stripe.com/c/pay/${sessionId}`
      }
    } catch (err) {
      console.error('Error upgrading to lifetime:', err)
      setError('Failed to start upgrade process')
    } finally {
      setIsLoading(false)
    }
  }

  const getUpgradePrice = () => {
    if (subscription?.billing_cycle === 'yearly') {
      return "as low as $25" // Depends on remaining time
    }
    return "$50" // Full price for monthly users
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <div className="max-w-4xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        </div>

        {/* Main Upgrade Card */}
        <Card className="shadow-lg border border-slate-200 dark:border-slate-700">
          <CardHeader className="text-center pb-6">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <Crown className="h-12 w-12 text-slate-700 dark:text-slate-300" />
              <Sparkles className="h-8 w-8 text-slate-600 dark:text-slate-400" />
            </div>
            <CardTitle className="text-4xl font-semibold text-slate-900 dark:text-slate-50 tracking-tight">
              Upgrade to Lifetime Access
            </CardTitle>
            <CardDescription className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              Switch to lifetime access and never worry about subscription payments again
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-8">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Current vs Lifetime Comparison */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Current Plan */}
              <Card className="border border-slate-200 dark:border-slate-700">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg">Your Current Plan</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span>Plan:</span>
                    <Badge variant="outline">
                      Premium {subscription?.billing_cycle === 'yearly' ? 'Yearly' : 'Monthly'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Cost:</span>
                    <span className="font-semibold">
                      ${subscription?.billing_cycle === 'yearly' ? '25' : '5'}/
                      {subscription?.billing_cycle === 'yearly' ? 'year' : 'month'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Billing:</span>
                    <span className="text-orange-600">Recurring</span>
                  </div>
                </CardContent>
              </Card>

              {/* Lifetime Plan */}
              <Card className="border-2 border-slate-900 dark:border-slate-100 bg-slate-50 dark:bg-slate-900">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg text-slate-900 dark:text-slate-100">
                    Lifetime Access
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span>Plan:</span>
                    <Badge className="bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900">
                      Premium Lifetime
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Cost:</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {getUpgradePrice()} (one-time)
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Billing:</span>
                    <span className="text-green-600 font-semibold">Never again!</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Benefits */}
            <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-6 space-y-4 border border-slate-200 dark:border-slate-700">
              <h3 className="text-xl font-semibold text-center text-slate-900 dark:text-slate-100">What You Get</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  "No more recurring payments",
                  "Lifetime access to all premium features",
                  "Future feature updates included",
                  "Priority support forever",
                  "Peace of mind",
                  "One-time payment only"
                ].map((benefit, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <Check className="h-5 w-5 text-green-600 flex-shrink-0" />
                    <span className="text-slate-700 dark:text-slate-300">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Upgrade Button */}
            <div className="text-center space-y-4">
              <Button
                onClick={handleUpgradeToLifetime}
                disabled={isLoading}
                size="lg"
                className="w-full max-w-md h-14 text-lg font-semibold bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-slate-200 dark:text-slate-900 text-white"
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                    <span>Processing...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Zap className="h-5 w-5" />
                    <span>Upgrade to Lifetime - {getUpgradePrice()}</span>
                  </div>
                )}
              </Button>

              <p className="text-sm text-slate-600 dark:text-slate-400">
                {subscription?.billing_cycle === 'yearly' 
                  ? "You'll receive credit for your remaining subscription time"
                  : "Your monthly subscription will be cancelled automatically"
                }
              </p>
            </div>

            {/* Trust Indicators */}
            <div className="text-center space-y-2 pt-6 border-t border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-center space-x-6 text-sm text-slate-600 dark:text-slate-400">
                <div className="flex items-center space-x-1">
                  <Shield className="h-4 w-4" />
                  <span>Secure Payment</span>
                </div>
                <div className="flex items-center space-x-1">
                  <X className="h-4 w-4" />
                  <span>No Hidden Fees</span>
                </div>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-500">
                Powered by Stripe • 30-day money-back guarantee
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 