"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Crown, Zap, Check, ArrowRight, Sparkles } from "lucide-react"
import { useAuth } from "@/components/auth/auth-provider"
import { usePremium } from "@/hooks/usePremium"
import { stripeOperations, STRIPE_CONFIG } from "@/lib/premium"
import { cn } from "@/lib/utils"

interface PremiumUpgradeCardProps {
  className?: string
}

export function PremiumUpgradeCard({ className }: PremiumUpgradeCardProps) {
  const { user } = useAuth()
  const { subscription, isPremium } = usePremium()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Only show to premium users who don't have lifetime access
  if (!user || !isPremium || subscription?.billing_cycle === 'lifetime') {
    return null
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
        // Redirect to Stripe Checkout
        const { loadStripe } = await import('@stripe/stripe-js') as any
        const stripe = await loadStripe(STRIPE_CONFIG.publishableKey)
        
        if (stripe) {
          await stripe.redirectToCheckout({ sessionId })
        }
      }
    } catch (err) {
      console.error('Error upgrading to lifetime:', err)
      setError('Failed to start upgrade process')
    } finally {
      setIsLoading(false)
    }
  }

  const getUpgradePrice = () => {
    // This is a simplified calculation - the actual price will be calculated server-side
    if (subscription?.billing_cycle === 'yearly') {
      return "as low as $10" // Depends on remaining time
    }
    return "$50" // Full price for monthly users
  }

  return (
    <Card className={cn("border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950/20 dark:to-yellow-950/20 shadow-lg", className)}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Crown className="h-6 w-6 text-amber-600" />
            <CardTitle className="text-xl font-bold text-amber-800 dark:text-amber-200">
              Upgrade to Lifetime
            </CardTitle>
          </div>
          <Badge className="bg-gradient-to-r from-amber-500 to-yellow-500 text-white">
            <Sparkles className="h-3 w-3 mr-1" />
            Limited Time
          </Badge>
        </div>
        <CardDescription className="text-amber-700 dark:text-amber-300">
          Switch to lifetime access and never pay again
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Current Plan:</span>
            <Badge variant="outline">
              Premium {subscription?.billing_cycle === 'yearly' ? 'Yearly' : 'Monthly'}
            </Badge>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Upgrade Price:</span>
            <span className="text-lg font-bold text-amber-600">
              {getUpgradePrice()}
            </span>
          </div>
        </div>

        <div className="bg-white/60 dark:bg-slate-800/60 rounded-lg p-4 space-y-2">
          <h4 className="font-semibold text-sm">What you get:</h4>
          <div className="space-y-1">
            {[
              "No more recurring payments",
              "Lifetime access to all premium features",
              "Future feature updates included",
              "Priority support forever"
            ].map((benefit, index) => (
              <div key={index} className="flex items-center space-x-2 text-sm">
                <Check className="h-3 w-3 text-green-600 flex-shrink-0" />
                <span>{benefit}</span>
              </div>
            ))}
          </div>
        </div>

        <Button
          onClick={handleUpgradeToLifetime}
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-700 hover:to-yellow-700 text-white font-semibold"
        >
          {isLoading ? (
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
              <span>Processing...</span>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Zap className="h-4 w-4" />
              <span>Upgrade to Lifetime</span>
              <ArrowRight className="h-4 w-4" />
            </div>
          )}
        </Button>

        <p className="text-xs text-center text-amber-600 dark:text-amber-400">
          {subscription?.billing_cycle === 'yearly' 
            ? "You'll receive credit for your remaining subscription time"
            : "Cancel your monthly subscription and pay once"
          }
        </p>
      </CardContent>
    </Card>
  )
} 