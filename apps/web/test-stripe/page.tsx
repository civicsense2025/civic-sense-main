"use client"

import { useState } from "react"
import { useAuth } from "@civicsense/ui-web/components/auth/auth-provider"
import { usePremium } from "@civicsense/shared/hooks/usePremium"
import { Button } from "@civicsense/ui-web/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@civicsense/ui-web/components/ui/card"
import { Badge } from "@civicsense/ui-web/components/ui/badge"
import { loadStripe } from "@stripe/stripe-js"

function StripeTestPage() {
  const { user } = useAuth()
  const { subscription, isPremium, isLoading } = usePremium()
  const [testingCheckout, setTestingCheckout] = useState(false)

  const testCheckout = async (priceType: 'yearly' | 'lifetime') => {
    if (!user) return
    
    setTestingCheckout(true)
    try {
      const priceId = priceType === 'yearly' 
        ? process.env.NEXT_PUBLIC_STRIPE_PREMIUM_YEARLY_PRICE_ID || 'price_1RZyUtG3ITPlpsLgGmypkdW4'
        : process.env.NEXT_PUBLIC_STRIPE_PREMIUM_LIFETIME_PRICE_ID || 'price_1RZxDbG3ITPlpsLgh94UsB0J'
      
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          priceId: priceId,
          successUrl: `${window.location.origin}/success?session_id={CHECKOUT_SESSION_ID}`,
          cancelUrl: `${window.location.origin}/cancel`
        })
      })

      const data = await response.json()
      
      if (data.error) {
        console.error('Error:', data.error)
        return
      }

      // Use Stripe.js to redirect to checkout
      const stripe = await loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)
      if (stripe && data.sessionId) {
        await stripe.redirectToCheckout({ sessionId: data.sessionId })
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setTestingCheckout(false)
    }
  }

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4">
        <Card>
          <CardContent className="p-6 text-center">
            <p>Please sign in to test Stripe integration</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto py-12 px-4">
      <Card>
        <CardHeader>
          <CardTitle>Stripe Integration Test</CardTitle>
          <CardDescription>Test your $25 lifetime premium access</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Current Status */}
          <div>
            <h3 className="font-medium mb-2">Current Status:</h3>
            {isLoading ? (
              <Badge variant="secondary">Loading...</Badge>
            ) : isPremium ? (
              <Badge className="bg-blue-500 text-white">Premium Subscriber ($25 lifetime)</Badge>
            ) : (
              <Badge variant="outline">Free User</Badge>
            )}
          </div>

          {/* Subscription Details */}
          {subscription && (
            <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <h4 className="font-medium mb-2">Subscription Details:</h4>
              <div className="text-sm space-y-1">
                <p><strong>Tier:</strong> {subscription.subscription_tier}</p>
                <p><strong>Status:</strong> {subscription.subscription_status}</p>
                <p><strong>Provider:</strong> {subscription.payment_provider}</p>
                {subscription.subscription_end_date && (
                  <p><strong>Next billing:</strong> {new Date(subscription.subscription_end_date).toLocaleDateString()}</p>
                )}
              </div>
            </div>
          )}

          {/* Environment Check */}
          <div>
            <h3 className="font-medium mb-2">Environment Configuration:</h3>
            <div className="text-sm space-y-1">
              <p>Pricing: ✅ Inline pricing ($25 one-time)</p>
              <p>Publishable Key: {process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ? '✅ Configured' : '❌ Missing'}</p>
              <p>Mode: {process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.includes('pk_test_') ? '🧪 Test Mode' : '🔴 Live Mode'}</p>
            </div>
          </div>

          {/* Test Button */}
          <div className="space-y-4">
            <Button 
              onClick={() => testCheckout('lifetime')} 
              disabled={testingCheckout}
              className="w-full"
              size="lg"
            >
              {testingCheckout ? 'Creating checkout session...' : 'Test Premium Lifetime ($25)'}
            </Button>

            <Button 
              onClick={() => testCheckout('yearly')} 
              disabled={testingCheckout}
              className="w-full"
              size="lg"
            >
              {testingCheckout ? 'Creating checkout session...' : 'Test Premium Yearly ($50)'}
            </Button>

            {/* Test Card Info */}
            <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
              <h4 className="font-medium text-sm mb-2">Test Card Information:</h4>
              <div className="text-xs space-y-1">
                <p><strong>Card Number:</strong> 4242 4242 4242 4242</p>
                <p><strong>Expiry:</strong> Any future date (e.g., 12/28)</p>
                <p><strong>CVC:</strong> Any 3 digits (e.g., 123)</p>
                <p><strong>Name:</strong> Any name</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default StripeTestPage 