"use client"

import { useState } from "react"
import { useAuth } from "@/components/auth/auth-provider"
import { usePremium } from "@/hooks/usePremium"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Crown, Star, Check, X, Zap, BarChart3, 
  BookOpen, TrendingUp, Brain, Shield, 
  Download, Headphones, Clock, Users,
  Sparkles, ArrowRight
} from "lucide-react"
import { cn } from "@/lib/utils"
import { stripeOperations } from "@/lib/premium"

interface PremiumFeaturesShowcaseProps {
  className?: string
  onClose?: () => void
}

interface PricingTier {
  id: 'free' | 'premium' | 'pro'
  name: string
  price: {
    monthly: number
    yearly: number
  }
  description: string
  icon: React.ReactNode
  features: Array<{
    name: string
    included: boolean
    description?: string
  }>
  popular?: boolean
  priceIds: {
    monthly: string
    yearly: string
  }
}

const pricingTiers: PricingTier[] = [
  {
    id: 'free',
    name: 'Free',
    price: { monthly: 0, yearly: 0 },
    description: 'Perfect for getting started with civic education',
    icon: <BookOpen className="h-6 w-6" />,
    features: [
      { name: 'Daily civic quizzes', included: true },
      { name: 'Basic progress tracking', included: true },
      { name: '1 month history', included: true },
      { name: 'Community features', included: true },
      { name: 'Custom decks', included: false },
      { name: 'Advanced analytics', included: false },
      { name: 'Learning insights', included: false },
      { name: 'Priority support', included: false },
    ],
    priceIds: { monthly: '', yearly: '' }
  },
  {
    id: 'premium',
    name: 'Premium',
    price: { monthly: 9.99, yearly: 99.99 },
    description: 'Enhanced learning with advanced features',
    icon: <Crown className="h-6 w-6" />,
    popular: true,
    features: [
      { name: 'Everything in Free', included: true },
      { name: 'Up to 10 custom decks', included: true, description: 'Create personalized study collections' },
      { name: 'Advanced analytics', included: true, description: 'Detailed performance insights' },
      { name: '12 months history', included: true, description: 'Track long-term progress' },
      { name: 'Learning insights', included: true, description: 'AI-powered recommendations' },
      { name: 'Spaced repetition', included: true, description: 'Optimized review scheduling' },
      { name: 'Data export', included: true, description: 'Download your progress data' },
      { name: 'Priority support', included: false },
    ],
    priceIds: {
      monthly: process.env.NEXT_PUBLIC_STRIPE_PREMIUM_MONTHLY_PRICE_ID || 'price_premium_monthly',
      yearly: process.env.NEXT_PUBLIC_STRIPE_PREMIUM_YEARLY_PRICE_ID || 'price_premium_yearly'
    }
  },
  {
    id: 'pro',
    name: 'Pro',
    price: { monthly: 19.99, yearly: 199.99 },
    description: 'Ultimate civic education experience',
    icon: <Star className="h-6 w-6" />,
    features: [
      { name: 'Everything in Premium', included: true },
      { name: 'Unlimited custom decks', included: true, description: 'No limits on personalization' },
      { name: 'Unlimited history', included: true, description: 'Complete historical tracking' },
      { name: 'Priority support', included: true, description: '24/7 dedicated assistance' },
      { name: 'Early access features', included: true, description: 'Beta features and updates' },
      { name: 'Advanced AI insights', included: true, description: 'Cutting-edge learning optimization' },
      { name: 'Custom branding', included: true, description: 'Personalize your experience' },
      { name: 'API access', included: true, description: 'Integrate with other tools' },
    ],
    priceIds: {
      monthly: process.env.NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PRICE_ID || 'price_pro_monthly',
      yearly: process.env.NEXT_PUBLIC_STRIPE_PRO_YEARLY_PRICE_ID || 'price_pro_yearly'
    }
  }
]

export function PremiumFeaturesShowcase({ className, onClose }: PremiumFeaturesShowcaseProps) {
  const { user } = useAuth()
  const { subscription, isPremium, isPro } = usePremium()
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('yearly')
  const [isUpgrading, setIsUpgrading] = useState<string | null>(null)

  const handleUpgrade = async (tier: PricingTier) => {
    if (!user) {
      // Handle sign-in required
      return
    }

    setIsUpgrading(tier.id)
    try {
      const priceId = tier.priceIds[billingCycle]
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
    if (isPro) return 'pro'
    if (isPremium) return 'premium'
    return 'free'
  }

  const getYearlySavings = (tier: PricingTier) => {
    const monthlyTotal = tier.price.monthly * 12
    const yearlySavings = monthlyTotal - tier.price.yearly
    const savingsPercentage = Math.round((yearlySavings / monthlyTotal) * 100)
    return { amount: yearlySavings, percentage: savingsPercentage }
  }

  return (
    <div className={cn("space-y-8", className)}>
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center space-x-2">
          <Sparkles className="h-8 w-8 text-yellow-500" />
          <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Upgrade Your Civic Education
          </h2>
        </div>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Unlock advanced features and accelerate your journey to becoming an informed, engaged citizen
        </p>
      </div>

      {/* Billing Toggle */}
      <div className="flex items-center justify-center space-x-4">
        <span className={cn("text-sm", billingCycle === 'monthly' ? 'font-medium' : 'text-muted-foreground')}>
          Monthly
        </span>
        <button
          onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
          className={cn(
            "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
            billingCycle === 'yearly' ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
          )}
        >
          <span
            className={cn(
              "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
              billingCycle === 'yearly' ? 'translate-x-6' : 'translate-x-1'
            )}
          />
        </button>
        <div className="flex items-center space-x-2">
          <span className={cn("text-sm", billingCycle === 'yearly' ? 'font-medium' : 'text-muted-foreground')}>
            Yearly
          </span>
          <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300">
            Save up to 17%
          </Badge>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {pricingTiers.map((tier) => {
          const currentTier = getCurrentTier()
          const isCurrentTier = currentTier === tier.id
          const canUpgrade = (currentTier === 'free' && tier.id !== 'free') || 
                           (currentTier === 'premium' && tier.id === 'pro')
          const savings = getYearlySavings(tier)

          return (
            <Card 
              key={tier.id}
              className={cn(
                "relative overflow-hidden transition-all duration-300",
                tier.popular && "border-2 border-blue-500 shadow-lg scale-105",
                isCurrentTier && "ring-2 ring-green-500"
              )}
            >
              {tier.popular && (
                <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-blue-500 to-purple-500 text-white text-center py-2 text-sm font-medium">
                  Most Popular
                </div>
              )}
              
              {isCurrentTier && (
                <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-center py-2 text-sm font-medium">
                  Current Plan
                </div>
              )}

              <CardHeader className={cn("text-center", tier.popular || isCurrentTier ? "pt-12" : "pt-6")}>
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <div className={cn(
                    "p-2 rounded-lg",
                    tier.id === 'free' ? "bg-gray-100 dark:bg-gray-800" :
                    tier.id === 'premium' ? "bg-yellow-100 dark:bg-yellow-900/20" :
                    "bg-purple-100 dark:bg-purple-900/20"
                  )}>
                    {tier.icon}
                  </div>
                </div>
                <CardTitle className="text-2xl">{tier.name}</CardTitle>
                <CardDescription>{tier.description}</CardDescription>
                
                <div className="space-y-2">
                  <div className="text-4xl font-bold">
                    ${tier.price[billingCycle]}
                    <span className="text-lg font-normal text-muted-foreground">
                      /{billingCycle === 'yearly' ? 'year' : 'month'}
                    </span>
                  </div>
                  
                  {billingCycle === 'yearly' && tier.price.yearly > 0 && (
                    <div className="text-sm text-green-600 dark:text-green-400">
                      Save ${savings.amount}/year ({savings.percentage}% off)
                    </div>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {tier.features.map((feature, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      {feature.included ? (
                        <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                      ) : (
                        <X className="h-5 w-5 text-gray-300 mt-0.5 flex-shrink-0" />
                      )}
                      <div className="flex-1">
                        <span className={cn(
                          "text-sm",
                          feature.included ? "text-foreground" : "text-muted-foreground"
                        )}>
                          {feature.name}
                        </span>
                        {feature.description && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {feature.description}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-4">
                  {isCurrentTier ? (
                    <Button disabled className="w-full">
                      <Check className="h-4 w-4 mr-2" />
                      Current Plan
                    </Button>
                  ) : canUpgrade ? (
                    <Button 
                      onClick={() => handleUpgrade(tier)}
                      disabled={isUpgrading === tier.id}
                      className={cn(
                        "w-full",
                        tier.id === 'premium' 
                          ? "bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600"
                          : "bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600"
                      )}
                    >
                      {isUpgrading === tier.id ? (
                        "Processing..."
                      ) : (
                        <>
                          <Crown className="h-4 w-4 mr-2" />
                          Upgrade to {tier.name}
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

      {/* Feature Comparison */}
      <div className="space-y-6">
        <h3 className="text-2xl font-bold text-center">Feature Comparison</h3>
        
        <Tabs defaultValue="analytics" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="customization">Customization</TabsTrigger>
            <TabsTrigger value="support">Support</TabsTrigger>
            <TabsTrigger value="data">Data & Export</TabsTrigger>
          </TabsList>
          
          <TabsContent value="analytics" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5" />
                  <span>Advanced Analytics</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium">Performance Tracking</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Weekly progress trends</li>
                    <li>• Category-specific accuracy</li>
                    <li>• Learning velocity metrics</li>
                    <li>• Streak analysis</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">Predictive Insights</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• AI-powered recommendations</li>
                    <li>• Optimal study timing</li>
                    <li>• Difficulty progression</li>
                    <li>• Knowledge gap identification</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="customization" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BookOpen className="h-5 w-5" />
                  <span>Custom Learning Decks</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium">Deck Creation</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Topic-specific collections</li>
                    <li>• Mixed difficulty levels</li>
                    <li>• Custom question types</li>
                    <li>• Collaborative sharing</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">Smart Scheduling</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Spaced repetition algorithm</li>
                    <li>• Adaptive difficulty</li>
                    <li>• Progress-based scheduling</li>
                    <li>• Review optimization</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="support" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Headphones className="h-5 w-5" />
                  <span>Priority Support</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium">Response Times</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Free: 48-72 hours</li>
                    <li>• Premium: 24 hours</li>
                    <li>• Pro: 4 hours</li>
                    <li>• Pro: Live chat available</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">Support Channels</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Email support</li>
                    <li>• In-app messaging</li>
                    <li>• Video tutorials</li>
                    <li>• One-on-one sessions (Pro)</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="data" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Download className="h-5 w-5" />
                  <span>Data & Export</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium">Data Retention</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Free: 1 month history</li>
                    <li>• Premium: 12 months history</li>
                    <li>• Pro: Unlimited history</li>
                    <li>• Automatic backups</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">Export Options</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• CSV progress reports</li>
                    <li>• PDF certificates</li>
                    <li>• JSON data export</li>
                    <li>• API access (Pro)</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* FAQ Section */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-center">Frequently Asked Questions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4">
              <h4 className="font-medium mb-2">Can I change plans anytime?</h4>
              <p className="text-sm text-muted-foreground">
                Yes! You can upgrade, downgrade, or cancel your subscription at any time through your account settings.
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <h4 className="font-medium mb-2">What happens to my data if I downgrade?</h4>
              <p className="text-sm text-muted-foreground">
                Your data is preserved, but access to premium features is limited. You can always upgrade to regain full access.
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <h4 className="font-medium mb-2">Is there a free trial?</h4>
              <p className="text-sm text-muted-foreground">
                New users get a 7-day free trial of Premium features. No credit card required to start.
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <h4 className="font-medium mb-2">Do you offer student discounts?</h4>
              <p className="text-sm text-muted-foreground">
                Yes! Students get 50% off all plans with a valid .edu email address. Contact support for details.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 