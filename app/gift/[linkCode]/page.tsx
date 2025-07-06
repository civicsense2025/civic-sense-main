"use client"

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Gift, Mail, ArrowRight, CheckCircle, AlertCircle, Clock, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/components/auth/auth-provider'
import { useToast } from '@/hooks/use-toast'

interface LinkInfo {
  title: string
  message: string | null
  accessType: 'annual' | 'lifetime'
  availableCredits: number
  totalCredits: number
  expiresAt: string
}

export default function GiftClaimPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const { toast } = useToast()
  
  const linkCode = params.linkCode as string
  
  const [linkInfo, setLinkInfo] = useState<LinkInfo | null>(null)
  const [isValidLink, setIsValidLink] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isClaiming, setIsClaiming] = useState(false)
  const [claimSuccess, setClaimSuccess] = useState(false)
  const [claimError, setClaimError] = useState<string | null>(null)
  
  // Form state
  const [email, setEmail] = useState(user?.email || '')

  // Load link info on mount
  useEffect(() => {
    if (linkCode) {
      loadLinkInfo()
    }
  }, [linkCode])

  const loadLinkInfo = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/claim-gift-link?linkCode=${linkCode}`)
      const data = await response.json()
      
      if (data.success && data.valid) {
        setLinkInfo(data.linkInfo)
        setIsValidLink(true)
      } else {
        setIsValidLink(false)
        setClaimError(data.error || 'Invalid gift link')
      }
    } catch (error) {
      console.error('Error loading link info:', error)
      setIsValidLink(false)
      setClaimError('Failed to load gift link')
    } finally {
      setIsLoading(false)
    }
  }

  const handleClaimGift = async () => {
    if (!email || !linkCode || isClaiming) return

    setIsClaiming(true)
    setClaimError(null)
    
    try {
      const response = await fetch('/api/claim-gift-link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          linkCode,
          claimerEmail: email,
          claimerUserId: user?.id || null
        }),
      })

      const result = await response.json()

      if (response.ok && result.success) {
        setClaimSuccess(true)
        toast({
          title: "Gift claimed successfully! 🎁",
          description: `You now have ${result.accessType === 'lifetime' ? 'lifetime' : 'annual'} access to CivicSense`,
        })

        // Redirect to dashboard or login after a delay
        setTimeout(() => {
          if (user) {
            router.push('/dashboard')
          } else {
            router.push('/login?message=Gift claimed! Please sign in to access your premium features.')
          }
        }, 3000)
      } else {
        setClaimError(result.error || 'Failed to claim gift')
      }
    } catch (error) {
      console.error('Error claiming gift:', error)
      setClaimError('Something went wrong. Please try again.')
    } finally {
      setIsClaiming(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900 dark:border-white mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Loading gift...</p>
        </div>
      </div>
    )
  }

  if (!isValidLink || !linkInfo) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center p-8">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-6" />
          <h1 className="text-2xl font-light text-slate-900 dark:text-white mb-4">
            Gift Link Invalid
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            {claimError || 'This gift link is invalid, expired, or has been fully claimed.'}
          </p>
          <Button 
            onClick={() => router.push('/')}
            variant="outline"
          >
            Go to CivicSense
          </Button>
        </div>
      </div>
    )
  }

  if (claimSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 dark:from-green-950 dark:via-slate-900 dark:to-emerald-950 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-lg mx-auto text-center p-8"
        >
          <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-6" />
          <h1 className="text-3xl font-light text-slate-900 dark:text-white mb-4">
            Welcome to CivicSense!
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 mb-6">
            You now have {linkInfo.accessType === 'lifetime' ? 'lifetime' : 'annual'} access to all premium features.
          </p>
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-green-200 dark:border-green-800 mb-6">
            <h3 className="font-medium text-slate-900 dark:text-white mb-2">What's included:</h3>
            <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
              <li>• Unlimited quiz access</li>
              <li>• Advanced analytics</li>
              <li>• Priority support</li>
              <li>• Ad-free experience</li>
            </ul>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-500">
            {user ? 'Redirecting to dashboard...' : 'Redirecting to sign in...'}
          </p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="max-w-2xl mx-auto px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          {/* Header */}
          <div className="text-center space-y-4">
            <Gift className="w-16 h-16 text-blue-600 mx-auto" />
            <h1 className="text-3xl sm:text-4xl font-light text-slate-900 dark:text-white leading-tight">
              {linkInfo.title}
            </h1>
            {linkInfo.message && (
              <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed max-w-xl mx-auto">
                {linkInfo.message}
              </p>
            )}
          </div>

          {/* Gift Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gift className="w-5 h-5 text-green-600" />
                Gift Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-slate-50 dark:bg-slate-900 rounded-xl">
                  <Badge variant="outline" className="mb-2">
                    {linkInfo.accessType === 'lifetime' ? 'Lifetime' : 'Annual'}
                  </Badge>
                  <div className="text-sm text-slate-600 dark:text-slate-400">
                    Access Type
                  </div>
                </div>
                
                <div className="text-center p-4 bg-slate-50 dark:bg-slate-900 rounded-xl">
                  <div className="flex items-center justify-center gap-1 mb-2">
                    <Users className="w-4 h-4 text-blue-600" />
                    <span className="font-medium text-slate-900 dark:text-white">
                      {linkInfo.availableCredits}
                    </span>
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">
                    Available Claims
                  </div>
                </div>
                
                <div className="text-center p-4 bg-slate-50 dark:bg-slate-900 rounded-xl">
                  <div className="flex items-center justify-center gap-1 mb-2">
                    <Clock className="w-4 h-4 text-orange-600" />
                    <span className="font-medium text-slate-900 dark:text-white">
                      {Math.ceil((new Date(linkInfo.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))}d
                    </span>
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">
                    Days Left
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Claim Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-blue-600" />
                Claim Your Access
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isClaiming}
                />
                <p className="text-sm text-slate-500 dark:text-slate-500">
                  {user ? 'Claiming for your current account' : 'You can sign up with this email after claiming'}
                </p>
              </div>

              {claimError && (
                <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-sm text-red-600 dark:text-red-400">
                    {claimError}
                  </p>
                </div>
              )}

              <Button
                onClick={handleClaimGift}
                disabled={!email || isClaiming || linkInfo.availableCredits <= 0}
                className="w-full h-12 text-lg"
              >
                {isClaiming ? (
                  'Claiming...'
                ) : (
                  <>
                    Claim {linkInfo.accessType === 'lifetime' ? 'Lifetime' : 'Annual'} Access
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </>
                )}
              </Button>

              <p className="text-xs text-slate-500 dark:text-slate-500 text-center">
                By claiming this gift, you agree to our Terms of Service and Privacy Policy
              </p>
            </CardContent>
          </Card>

          {/* About CivicSense */}
          <Card>
            <CardContent className="p-6">
              <h3 className="font-medium text-slate-900 dark:text-white mb-3">
                About CivicSense
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                CivicSense transforms passive observers into confident, informed participants in democracy. 
                We bridge the gap between civic knowledge and meaningful action through accessible, 
                engaging digital learning that cuts through misinformation and builds critical thinking skills.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
} 