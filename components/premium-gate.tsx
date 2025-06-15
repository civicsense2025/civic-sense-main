"use client"

import { useState } from "react"
import { useAuth } from "@/components/auth/auth-provider"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Crown, Zap, Star, Check, X, Sparkles, 
  TrendingUp, BookOpen, BarChart3, Brain,
  Shield, Download, Headphones
} from "lucide-react"
import { cn } from "@/lib/utils"
import { 
  stripeOperations, 
  STRIPE_CONFIG,
  type PremiumFeature
} from "@/lib/premium"

interface PremiumGateProps {
  feature: PremiumFeature
  isOpen: boolean
  onClose: () => void
  title?: string
  description?: string
  children?: React.ReactNode
}

const FEATURE_DETAILS = {
  custom_decks: {
    icon: BookOpen,
    title: "Custom Learning Decks",
    description: "Create personalized study collections tailored to your interests and learning goals.",
    benefits: [
      "Mix and match topics from different categories",
      "Save your favorite questions for review",
      "Track progress on custom collections",
      "Share decks with friends and study groups"
    ]
  },
  historical_progress: {
    icon: TrendingUp,
    title: "Historical Progress Tracking",
    description: "Access detailed progress history and track your learning journey over time.",
    benefits: [
      "View progress charts and trends",
      "Compare performance across different time periods",
      "Export your learning data",
      "Set and track long-term goals"
    ]
  },
  advanced_analytics: {
    icon: BarChart3,
    title: "Advanced Analytics",
    description: "Get detailed insights into your learning patterns and performance.",
    benefits: [
      "Detailed performance breakdowns by category",
      "Time-based learning analytics",
      "Identify strengths and weaknesses",
      "Personalized improvement recommendations"
    ]
  },
  spaced_repetition: {
    icon: Brain,
    title: "Spaced Repetition",
    description: "Optimize your learning with scientifically-proven spaced repetition algorithms.",
    benefits: [
      "Questions resurface at optimal intervals",
      "Focus on areas that need improvement",
      "Maximize retention and recall",
      "Adaptive difficulty adjustment"
    ]
  },
  learning_insights: {
    icon: Sparkles,
    title: "AI Learning Insights",
    description: "Get personalized recommendations and insights powered by AI.",
    benefits: [
      "Personalized study recommendations",
      "Learning pattern analysis",
      "Optimal study time suggestions",
      "Achievement predictions and goals"
    ]
  },
  priority_support: {
    icon: Headphones,
    title: "Priority Support",
    description: "Get faster response times and dedicated support for your questions.",
    benefits: [
      "Priority email support",
      "Faster response times",
      "Direct access to our team",
      "Feature request priority"
    ]
  },
  offline_mode: {
    icon: Shield,
    title: "Offline Mode",
    description: "Download quizzes and study materials for offline access.",
    benefits: [
      "Study without internet connection",
      "Download favorite quizzes",
      "Sync progress when back online",
      "Perfect for travel or commuting"
    ]
  },
  export_data: {
    icon: Download,
    title: "Data Export",
    description: "Export your learning data and progress for external analysis.",
    benefits: [
      "Export progress data as CSV/JSON",
      "Download quiz results and analytics",
      "Backup your learning history",
      "Use data in external tools"
    ]
  }
} as const

export function PremiumGate({ 
  feature, 
  isOpen, 
  onClose, 
  title, 
  description, 
  children 
}: PremiumGateProps) {
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(false)

  const featureDetail = FEATURE_DETAILS[feature]
  const FeatureIcon = featureDetail.icon

  const handleUpgrade = async () => {
    if (!user) return

    setIsLoading(true)
    try {
      // For one-time payments, we don't need a price ID since we create the price inline
      const successUrl = `${window.location.origin}/premium/success`
      const cancelUrl = window.location.href

      const { sessionId, error } = await stripeOperations.createCheckoutSession(
        user.id,
        'premium_lifetime', // This will be handled as a special case
        successUrl,
        cancelUrl
      )

      if (error) {
        console.error('Error creating checkout session:', error)
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
    } catch (error) {
      console.error('Error during upgrade:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[95vh] overflow-hidden p-0 gap-0">
        <DialogHeader className="px-8 pt-8 pb-6 border-b bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20">
          <DialogTitle className="flex items-center space-x-3 text-3xl font-bold">
            <div className="relative">
              <FeatureIcon className="h-8 w-8 text-blue-600" />
              <Crown className="h-4 w-4 text-yellow-500 absolute -top-1 -right-1" />
            </div>
            <span className="bg-gradient-to-r from-blue-600 to-indigo-700 bg-clip-text text-transparent">
              {title || featureDetail.title}
            </span>
            <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white border-0">
              Premium
            </Badge>
          </DialogTitle>
          <DialogDescription className="text-base text-muted-foreground mt-2 leading-relaxed">
            {description || featureDetail.description}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-8 pb-8">
          <div className="space-y-8 pt-6">
            {/* Feature Benefits */}
            <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-blue-950/10 dark:via-background dark:to-purple-950/10">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center space-x-2 text-xl">
                  <Star className="h-5 w-5 text-yellow-500" />
                  <span>What you'll get with this feature</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {featureDetail.benefits.map((benefit, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <Check className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-sm leading-relaxed">{benefit}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Premium Plan Card */}
            <Card className="border-2 border-blue-500 shadow-xl bg-gradient-to-br from-white to-blue-50 dark:from-slate-900 dark:to-blue-950/20">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-2xl font-bold text-blue-600">CivicSense Premium</CardTitle>
                  <Badge className="bg-blue-500 text-white">Best Value</Badge>
                </div>
                <div className="space-y-1">
                  <div className="text-4xl font-black">
                    ${STRIPE_CONFIG.plans.premium.lifetimePrice}
                    <span className="text-lg font-normal text-muted-foreground"> lifetime</span>
                  </div>
                  <div className="text-sm text-green-600 font-medium">
                    Pay once, use forever • No recurring charges
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0 space-y-4">
                <div className="space-y-3">
                  {STRIPE_CONFIG.plans.premium.features.map((feature, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </div>

                <Button
                  onClick={handleUpgrade}
                  disabled={isLoading}
                  className="w-full h-12 text-lg font-bold bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg transition-all duration-300"
                >
                  {isLoading ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                      <span>Processing...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <Zap className="h-5 w-5" />
                      <span>Upgrade to Premium</span>
                    </div>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Trust Indicators */}
            <div className="text-center space-y-2 pt-4 border-t">
              <div className="flex items-center justify-center space-x-4 text-sm text-muted-foreground">
                <div className="flex items-center space-x-1">
                  <Shield className="h-4 w-4" />
                  <span>Secure Payment</span>
                </div>
                <div className="flex items-center space-x-1">
                  <X className="h-4 w-4" />
                  <span>Cancel Anytime</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Powered by Stripe • 30-day money-back guarantee
              </p>
            </div>

            {/* Custom Content */}
            {children && (
              <div className="pt-4 border-t">
                {children}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 