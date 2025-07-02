"use client"

import { useState } from "react"
import { useAuth } from "@/components/auth/auth-provider"
import { usePremium } from "@civicsense/shared/hooks/usePremium"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { Button } from "../ui/button"
import { Badge } from "../ui/badge"
import { 
  Crown, Star, Check, X, Sparkles, ArrowRight
} from "lucide-react"
import { cn } from "../../utils"
import { stripeOperations } from "@civicsense/shared/lib/premium"

interface PremiumFeaturesShowcaseProps {
  className?: string
  onClose?: () => void
}

interface PricingTier {
  id: 'free' | 'premium' | 'lifetime'
  name: string
  price: number
  billing: string
  description: string
  icon: React.ReactNode
  popular?: boolean
  priceId: string
}

const pricingTiers: PricingTier[] = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    billing: 'forever',
    description: 'Perfect for getting started with civic education',
    icon: <Star className="h-6 w-6" />,
    priceId: ''
  },
  {
    id: 'premium',
    name: 'Premium Yearly',
    price: 25,
    billing: 'per year',
    description: 'Annual subscription with all premium features',
    icon: <Crown className="h-6 w-6" />,
    priceId: 'price_1RZyUtG3ITPlpsLgGmypkdW4'
  },
  {
    id: 'lifetime',
    name: 'Premium Lifetime',
    price: 50,
    billing: 'one-time',
    description: 'Pay once, use forever - no recurring charges',
    icon: <Sparkles className="h-6 w-6" />,
    popular: true,
    priceId: 'price_1RZxDbG3ITPlpsLgh94UsB0J'
  }
]

const features = [
  { name: 'Daily civic quizzes', description: 'Fresh quiz content', free: true, premium: true, lifetime: true },
  { name: 'Basic progress tracking', description: 'Track your scores', free: true, premium: true, lifetime: true },
  { name: '1 month history', description: 'Limited data retention', free: true, premium: false, lifetime: false },
  { name: 'Community features', description: 'Connect with learners', free: true, premium: true, lifetime: true },
  { name: 'Unlimited custom decks', description: 'Personalized study sets', free: false, premium: true, lifetime: true },
  { name: 'Advanced analytics', description: 'Detailed performance insights', free: false, premium: true, lifetime: true },
  { name: 'Complete history', description: 'Unlimited data access', free: false, premium: true, lifetime: true },
  { name: 'Learning insights', description: 'AI-powered recommendations', free: false, premium: true, lifetime: true },
  { name: 'Spaced repetition', description: 'Optimized review timing', free: false, premium: true, lifetime: true },
  { name: 'Data export', description: 'Download your data', free: false, premium: true, lifetime: true },
  { name: 'Priority support', description: 'Faster help responses', free: false, premium: true, lifetime: true },
  { name: 'No recurring charges', description: 'Pay once, use forever', free: false, premium: false, lifetime: true },
]

export function PremiumFeaturesShowcase({ className, onClose }: PremiumFeaturesShowcaseProps) {
  const { user } = useAuth()
  const { subscription, isPremium } = usePremium()
  const [isUpgrading, setIsUpgrading] = useState<string | null>(null)

  const handleUpgrade = async (tier: PricingTier) => {
    if (!user) {
      // Handle sign-in required
      return
    }

    setIsUpgrading(tier.id)
    try {
      const { sessionId, error } = await stripeOperations.createCheckoutSession(
        user.id,
        tier.priceId,
        `${window.location.origin}/success?session_id={CHECKOUT_SESSION_ID}`,
        `${window.location.origin}/cancel`
      )

      if (error) {
        console.error('Error creating checkout session:', error)
        return
      }

      if (sessionId) {
        // Redirect to Stripe Checkout
        const stripe = await import('@stripe/stripe-js').then(m => 
          m.loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)
        )
        
        if (stripe) {
          await stripe.redirectToCheckout({ sessionId })
        }
      }
    } catch (error) {
      console.error('Error during upgrade:', error)
    } finally {
      setIsUpgrading(null)
    }
  }

  const getCurrentTier = () => {
    if (!subscription) return 'free'
    if (subscription.billing_cycle === 'lifetime') return 'lifetime'
    return 'premium'
  }

  const currentTier = getCurrentTier()

  return (
    <div className={cn("space-y-12", className)}>
      {/* Header */}
      <div className="text-center space-y-4">
        <h2 className="text-3xl sm:text-4xl font-semibold text-slate-900 dark:text-slate-50 tracking-tight">
          Choose Your Plan
        </h2>
        <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
          Unlock advanced features and accelerate your civic education journey
        </p>
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {pricingTiers.map((tier) => {
          const isCurrentTier = currentTier === tier.id
          const canUpgrade = (currentTier === 'free' && tier.id !== 'free') || 
                           (currentTier === 'premium' && tier.id === 'lifetime')

          return (
            <Card 
              key={tier.id}
              className={cn(
                "relative overflow-hidden transition-all duration-300 border-2",
                tier.popular ? "border-slate-900 dark:border-slate-100 shadow-xl scale-105" : "border-slate-200 dark:border-slate-700",
                isCurrentTier && "ring-2 ring-green-500"
              )}
            >
              {tier.popular && (
                <div className="absolute top-0 left-0 right-0 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-center py-2 text-sm font-medium">
                  Most Popular
                </div>
              )}
              
              {isCurrentTier && (
                <div className="absolute top-0 left-0 right-0 bg-green-500 text-white text-center py-2 text-sm font-medium">
                  Current Plan
                </div>
              )}

              <CardHeader className={cn("text-center", tier.popular || isCurrentTier ? "pt-12" : "pt-6")}>
                <div className="flex items-center justify-center mb-4">
                  <div className={cn(
                    "p-3 rounded-lg",
                    tier.id === 'free' ? "bg-slate-100 dark:bg-slate-800" :
                    tier.id === 'premium' ? "bg-blue-100 dark:bg-blue-900/20" :
                    "bg-purple-100 dark:bg-purple-900/20"
                  )}>
                    {tier.icon}
                  </div>
                </div>
                <CardTitle className="text-xl font-semibold">{tier.name}</CardTitle>
                <CardDescription className="text-sm">{tier.description}</CardDescription>
                
                <div className="space-y-2 pt-4">
                  <div className="text-3xl font-bold text-slate-900 dark:text-slate-50">
                    ${tier.price}
                    <span className="text-base font-normal text-slate-600 dark:text-slate-400">
                      /{tier.billing}
                    </span>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                <div className="pt-4">
                  {isCurrentTier ? (
                    <Button disabled className="w-full bg-green-500 text-white">
                      <Check className="h-4 w-4 mr-2" />
                      Current Plan
                    </Button>
                  ) : canUpgrade ? (
                    <Button 
                      onClick={() => handleUpgrade(tier)}
                      disabled={isUpgrading === tier.id}
                      className={cn(
                        "w-full",
                        tier.popular 
                          ? "bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-slate-200 dark:text-slate-900"
                          : "bg-slate-600 hover:bg-slate-700 text-white"
                      )}
                    >
                      {isUpgrading === tier.id ? (
                        "Processing..."
                      ) : (
                        <>
                          Upgrade to {tier.name}
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </>
                      )}
                    </Button>
                  ) : tier.id === 'free' ? (
                    <Button variant="outline" disabled className="w-full">
                      Free Forever
                    </Button>
                  ) : (
                    <Button variant="outline" disabled className="w-full">
                      Contact Sales
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Feature Comparison Table */}
      <div className="space-y-6">
        <h3 className="text-2xl font-semibold text-center text-slate-900 dark:text-slate-50">
          Feature Comparison
        </h3>
        
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700">
                  <th className="text-left p-4 font-medium text-slate-900 dark:text-slate-50">Features</th>
                  <th className="text-center p-4 font-medium text-slate-900 dark:text-slate-50">Free</th>
                  <th className="text-center p-4 font-medium text-slate-900 dark:text-slate-50">Premium Yearly</th>
                  <th className="text-center p-4 font-medium text-slate-900 dark:text-slate-50 relative">
                    Premium Lifetime
                    <Badge className="absolute -top-2 -right-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs">
                      Popular
                    </Badge>
                  </th>
                </tr>
              </thead>
              <tbody>
                {features.map((feature, index) => (
                  <tr key={index} className="border-b border-slate-100 dark:border-slate-800 last:border-0">
                    <td className="p-4 text-slate-700 dark:text-slate-300">
                      <div className="space-y-1">
                        <div className="font-medium">{feature.name}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">{feature.description}</div>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      {feature.free ? (
                        <Check className="h-5 w-5 text-green-600 mx-auto" />
                      ) : (
                        <X className="h-5 w-5 text-slate-300 mx-auto" />
                      )}
                    </td>
                    <td className="p-4 text-center">
                      {feature.premium ? (
                        <Check className="h-5 w-5 text-green-600 mx-auto" />
                      ) : (
                        <X className="h-5 w-5 text-slate-300 mx-auto" />
                      )}
                    </td>
                    <td className="p-4 text-center">
                      {feature.lifetime ? (
                        <Check className="h-5 w-5 text-green-600 mx-auto" />
                      ) : (
                        <X className="h-5 w-5 text-slate-300 mx-auto" />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Simple FAQ */}
      <div className="space-y-6 max-w-3xl mx-auto">
        <h3 className="text-xl font-semibold text-center text-slate-900 dark:text-slate-50">
          Frequently Asked Questions
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <h4 className="font-medium text-slate-900 dark:text-slate-50">Can I change plans anytime?</h4>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Yes! You can upgrade or cancel your subscription at any time through your account settings.
            </p>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-medium text-slate-900 dark:text-slate-50">What happens to my data if I downgrade?</h4>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Your data is preserved, but access to premium features is limited. You can always upgrade to regain full access.
            </p>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-medium text-slate-900 dark:text-slate-50">Is there a free trial?</h4>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              New users get a 7-day free trial of Premium features. No credit card required to start.
            </p>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-medium text-slate-900 dark:text-slate-50">Do you offer student discounts?</h4>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Yes! Students get 50% off all plans with a valid .edu email address. Contact support for details.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
} 