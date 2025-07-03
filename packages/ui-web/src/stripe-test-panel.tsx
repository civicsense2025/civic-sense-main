"use client"

import { useState } from "react"
import { useAuth } from "@/components/auth/auth-provider"
import { usePremium } from '@civicsense/shared/usePremium'
import { Button } from "../ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { Badge } from "../ui/badge"
import { Alert, AlertDescription } from "../ui/alert"
import { stripeOperations } from '@civicsense/shared/premium'
import { CreditCard, Crown, Settings, CheckCircle, XCircle } from "lucide-react"

interface StripeTestPanelProps {
  className?: string
}

export function StripeTestPanel({ className }: StripeTestPanelProps) {
  const { user } = useAuth()
  const { subscription, isPremium, isPro, isLoading } = usePremium()
  const [testingSubscription, setTestingSubscription] = useState<string | null>(null)
  const [testResults, setTestResults] = useState<Array<{
    test: string
    success: boolean
    message: string
  }>>([])

  const runTests = async () => {
    if (!user) return

    setTestResults([])
    const results: typeof testResults = []

    // Test 1: Create checkout session
    try {
      const { sessionId, error } = await stripeOperations.createCheckoutSession(
        user.id,
        process.env.NEXT_PUBLIC_STRIPE_PREMIUM_YEARLY_PRICE_ID!,
        `${window.location.origin}/dashboard?test=success`,
        `${window.location.origin}/dashboard?test=cancelled`
      )

      if (error) {
        results.push({
          test: "Create Checkout Session",
          success: false,
          message: error
        })
      } else {
        results.push({
          test: "Create Checkout Session",
          success: true,
          message: `Session created: ${sessionId?.substring(0, 20)}...`
        })
      }
    } catch (error) {
      results.push({
        test: "Create Checkout Session",
        success: false,
        message: `Error: ${error}`
      })
    }

    // Test 2: Check if price IDs are configured
    const priceIds = [
      process.env.NEXT_PUBLIC_STRIPE_PREMIUM_YEARLY_PRICE_ID,
    ]

    const missingPriceIds = priceIds.filter(id => !id)
    if (missingPriceIds.length === 0) {
      results.push({
        test: "Price IDs Configuration",
        success: true,
        message: "All price IDs are configured"
      })
    } else {
      results.push({
        test: "Price IDs Configuration",
        success: false,
        message: `Missing ${missingPriceIds.length} price ID(s)`
      })
    }

    // Test 3: Test customer portal (only if user has subscription)
    if (subscription) {
      try {
        const { url, error } = await stripeOperations.createPortalSession(
          user.id,
          window.location.href
        )

        if (error) {
          results.push({
            test: "Customer Portal",
            success: false,
            message: error
          })
        } else {
          results.push({
            test: "Customer Portal",
            success: true,
            message: "Portal URL generated successfully"
          })
        }
      } catch (error) {
        results.push({
          test: "Customer Portal",
          success: false,
          message: `Error: ${error}`
        })
      }
    } else {
      results.push({
        test: "Customer Portal",
        success: false,
        message: "No subscription found (expected for testing)"
      })
    }

    setTestResults(results)
  }

  const handleTestSubscription = async (tier: 'premium' | 'pro', cycle: 'monthly' | 'yearly') => {
    if (!user) return

    setTestingSubscription(`${tier}-${cycle}`)
    try {
      const priceId = tier === 'premium' 
        ? (cycle === 'monthly' 
          ? process.env.NEXT_PUBLIC_STRIPE_PREMIUM_MONTHLY_PRICE_ID!
          : process.env.NEXT_PUBLIC_STRIPE_PREMIUM_YEARLY_PRICE_ID!)
        : (cycle === 'monthly' 
          ? process.env.NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PRICE_ID!
          : process.env.NEXT_PUBLIC_STRIPE_PRO_YEARLY_PRICE_ID!)

      const { sessionId, error } = await stripeOperations.createCheckoutSession(
        user.id,
        priceId,
        `${window.location.origin}/dashboard?upgrade=success`,
        `${window.location.origin}/dashboard?upgrade=cancelled`
      )

      if (error) {
        console.error('Error creating checkout session:', error)
        return
      }

      if (sessionId) {
        // Redirect to Stripe Checkout (use the existing pattern from your app)
        const stripe = await import('@stripe/stripe-js').then(m => 
          m.loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)
        )
        
        if (stripe) {
          await stripe.redirectToCheckout({ sessionId })
        }
      }
    } catch (error) {
      console.error('Error during test subscription:', error)
    } finally {
      setTestingSubscription(null)
    }
  }

  if (!user) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">
            Please sign in to test Stripe integration
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <CreditCard className="h-5 w-5" />
          <span>Stripe Integration Test Panel</span>
        </CardTitle>
        <CardDescription>
          Test your Stripe integration before going live
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Subscription Status */}
        <div className="space-y-2">
          <h3 className="font-medium">Current Subscription Status</h3>
          <div className="flex items-center space-x-2">
            {isLoading ? (
              <Badge variant="secondary">Loading...</Badge>
            ) : isPro ? (
              <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300">
                <Crown className="h-3 w-3 mr-1" />
                Pro
              </Badge>
            ) : isPremium ? (
              <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300">
                <Crown className="h-3 w-3 mr-1" />
                Premium
              </Badge>
            ) : (
              <Badge variant="secondary">Free</Badge>
            )}
          </div>
          {subscription && (
            <div className="text-sm text-muted-foreground">
              <p>Status: {subscription.subscription_status}</p>
              <p>Provider: {subscription.payment_provider}</p>
              {subscription.subscription_end_date && (
                <p>Ends: {new Date(subscription.subscription_end_date).toLocaleDateString()}</p>
              )}
            </div>
          )}
        </div>

        {/* Test Buttons */}
        <div className="space-y-4">
          <div>
            <Button onClick={runTests} className="w-full">
              Run Integration Tests
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Test Premium Subscription</h4>
              <Button
                onClick={() => handleTestSubscription('premium', 'monthly')}
                disabled={testingSubscription === 'premium-monthly'}
                variant="outline"
                size="sm"
                className="w-full"
              >
                {testingSubscription === 'premium-monthly' ? 'Processing...' : 'Premium Monthly ($9.99)'}
              </Button>
              <Button
                onClick={() => handleTestSubscription('premium', 'yearly')}
                disabled={testingSubscription === 'premium-yearly'}
                variant="outline"
                size="sm"
                className="w-full"
              >
                {testingSubscription === 'premium-yearly' ? 'Processing...' : 'Premium Yearly ($99.99)'}
              </Button>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium text-sm">Test Pro Subscription</h4>
              <Button
                onClick={() => handleTestSubscription('pro', 'monthly')}
                disabled={testingSubscription === 'pro-monthly'}
                variant="outline"
                size="sm"
                className="w-full"
              >
                {testingSubscription === 'pro-monthly' ? 'Processing...' : 'Pro Monthly ($19.99)'}
              </Button>
              <Button
                onClick={() => handleTestSubscription('pro', 'yearly')}
                disabled={testingSubscription === 'pro-yearly'}
                variant="outline"
                size="sm"
                className="w-full"
              >
                {testingSubscription === 'pro-yearly' ? 'Processing...' : 'Pro Yearly ($199.99)'}
              </Button>
            </div>
          </div>

          {subscription && (
            <Button
              onClick={async () => {
                const { url } = await stripeOperations.createPortalSession(user.id, window.location.href)
                if (url) window.open(url, '_blank')
              }}
              variant="outline"
              className="w-full"
            >
              <Settings className="h-4 w-4 mr-2" />
              Open Customer Portal
            </Button>
          )}
        </div>

        {/* Test Results */}
        {testResults.length > 0 && (
          <div className="space-y-2">
            <h3 className="font-medium">Test Results</h3>
            {testResults.map((result, index) => (
              <Alert key={index} className={result.success ? "border-green-200 bg-green-50 dark:bg-green-950/20" : "border-red-200 bg-red-50 dark:bg-red-950/20"}>
                <div className="flex items-center space-x-2">
                  {result.success ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-600" />
                  )}
                  <div className="flex-1">
                    <h4 className="font-medium text-sm">{result.test}</h4>
                    <AlertDescription className="text-xs">
                      {result.message}
                    </AlertDescription>
                  </div>
                </div>
              </Alert>
            ))}
          </div>
        )}

        {/* Test Card Information */}
        <Alert>
          <CreditCard className="h-4 w-4" />
          <AlertDescription>
            <strong>Test Card Numbers:</strong><br />
            Success: 4242 4242 4242 4242<br />
            Decline: 4000 0000 0000 0002<br />
            Use any future expiry date and any 3-digit CVC.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  )
} 