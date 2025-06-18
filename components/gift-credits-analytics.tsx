"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Gift, 
  Users, 
  TrendingUp, 
  Calendar, 
  Mail, 
  Link2, 
  CheckCircle, 
  Clock,
  DollarSign,
  Target,
  Eye,
  EyeOff
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface GiftAnalyticsSummary {
  total_donated_amount: number
  total_gift_credits_earned: number
  total_gift_credits_used: number
  conversion_rate: number
}

interface GiftClaim {
  id: string
  recipient_email: string
  access_type: 'annual' | 'lifetime'
  gift_message: string
  redemption_status: 'pending' | 'claimed' | 'expired'
  redemption_code: string
  expires_at: string
  claimed_at: string | null
  created_at: string
}

interface DetailedGiftCredit {
  id: string
  credit_type: 'annual' | 'lifetime'
  credits_available: number
  credits_used: number
  source_donation_amount: number
  source_stripe_session_id: string
  created_at: string
  individual_claims: GiftClaim[]
}

interface PersonHelped {
  email: string
  access_type: 'annual' | 'lifetime'
  claim_method: 'individual' | 'shareable_link'
  claimed_at: string
  gift_message: string
  redemption_code: string
}

export function GiftCreditsAnalytics() {
  const [summary, setSummary] = useState<GiftAnalyticsSummary | null>(null)
  const [detailedCredits, setDetailedCredits] = useState<DetailedGiftCredit[]>([])
  const [peopleHelped, setPeopleHelped] = useState<PersonHelped[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [showEmails, setShowEmails] = useState(false)

  useEffect(() => {
    loadAnalytics()
  }, [])

  const loadAnalytics = async () => {
    try {
      setLoading(true)
      
      // Load summary
      const summaryResponse = await fetch('/api/gift-credits/analytics?view=summary')
      if (summaryResponse.ok) {
        const summaryData = await summaryResponse.json()
        setSummary(summaryData.data)
      }

      // Load detailed credits
      const detailedResponse = await fetch('/api/gift-credits/analytics?view=detailed')
      if (detailedResponse.ok) {
        const detailedData = await detailedResponse.json()
        setDetailedCredits(detailedData.data)
      }

      // Load people helped
      const peopleResponse = await fetch('/api/gift-credits/analytics?view=people')
      if (peopleResponse.ok) {
        const peopleData = await peopleResponse.json()
        setPeopleHelped(peopleData.data)
      }

    } catch (error) {
      console.error('Error loading gift analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const maskEmail = (email: string) => {
    if (!showEmails) {
      const [username, domain] = email.split('@')
      return `${username.slice(0, 2)}***@${domain}`
    }
    return email
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded mb-2"></div>
                <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (!summary) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Gift className="h-12 w-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
            No Gift Credits Yet
          </h3>
          <p className="text-slate-600 dark:text-slate-400">
            Make a donation of $75+ to earn gift credits and start helping others access CivicSense.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-8">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  Total Donated
                </p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  {formatCurrency(summary.total_donated_amount)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  Gift Credits Earned
                </p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  {summary.total_gift_credits_earned}
                </p>
              </div>
              <Gift className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  Credits Used
                </p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  {summary.total_gift_credits_used}
                </p>
              </div>
              <Users className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  Conversion Rate
                </p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  {Math.round(summary.conversion_rate * 100)}%
                </p>
              </div>
              <Target className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Credit Batches</TabsTrigger>
          <TabsTrigger value="people">People Helped</TabsTrigger>
          <TabsTrigger value="claims">All Claims</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-slate-900 dark:text-white">
              Gift Credit Batches
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Organized by donation
            </p>
          </div>

          <div className="space-y-4">
            {detailedCredits.map((credit) => (
              <Card key={credit.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">
                      {formatCurrency(credit.source_donation_amount)} Donation
                    </CardTitle>
                    <div className="flex items-center space-x-2">
                      <Badge variant={credit.credit_type === 'lifetime' ? 'default' : 'secondary'}>
                        {credit.credit_type} credits
                      </Badge>
                      <span className="text-sm text-slate-500">
                        {formatDistanceToNow(new Date(credit.created_at), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="text-center p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
                      <p className="text-2xl font-bold text-slate-900 dark:text-white">
                        {credit.credits_available}
                      </p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        Total Credits
                      </p>
                    </div>
                    <div className="text-center p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
                      <p className="text-2xl font-bold text-green-600">
                        {credit.credits_used}
                      </p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        Used
                      </p>
                    </div>
                    <div className="text-center p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
                      <p className="text-2xl font-bold text-blue-600">
                        {credit.credits_available - credit.credits_used}
                      </p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        Remaining
                      </p>
                    </div>
                  </div>

                  {credit.individual_claims.length > 0 && (
                    <div>
                      <h4 className="font-medium text-slate-900 dark:text-white mb-3">
                        Individual Gifts from this Donation ({credit.individual_claims.length})
                      </h4>
                      <div className="space-y-2">
                        {credit.individual_claims.map((claim) => (
                          <div 
                            key={claim.id}
                            className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700"
                          >
                            <div className="flex items-center space-x-3">
                              <div className={`h-2 w-2 rounded-full ${
                                claim.redemption_status === 'claimed' ? 'bg-green-500' :
                                claim.redemption_status === 'expired' ? 'bg-red-500' : 'bg-yellow-500'
                              }`} />
                              <div>
                                <p className="font-medium text-slate-900 dark:text-white">
                                  {maskEmail(claim.recipient_email)}
                                </p>
                                <p className="text-sm text-slate-600 dark:text-slate-400">
                                  {claim.gift_message || 'No message'}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <Badge variant={claim.access_type === 'lifetime' ? 'default' : 'secondary'}>
                                {claim.access_type}
                              </Badge>
                              <p className="text-xs text-slate-500 mt-1">
                                {claim.redemption_status === 'claimed' && claim.claimed_at ? 
                                  `Claimed ${formatDistanceToNow(new Date(claim.claimed_at), { addSuffix: true })}` :
                                  `Sent ${formatDistanceToNow(new Date(claim.created_at), { addSuffix: true })}`
                                }
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="people" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-slate-900 dark:text-white">
              People You've Helped ({peopleHelped.length})
            </h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowEmails(!showEmails)}
              className="flex items-center space-x-2"
            >
              {showEmails ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              <span>{showEmails ? 'Hide' : 'Show'} Full Emails</span>
            </Button>
          </div>

          {peopleHelped.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Users className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
                  No Claims Yet
                </h3>
                <p className="text-slate-600 dark:text-slate-400">
                  Your gift credits are waiting to help people access CivicSense.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {peopleHelped.map((person, index) => (
                <Card key={index}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                          <span className="text-white font-medium text-sm">
                            {person.email.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-slate-900 dark:text-white">
                            {maskEmail(person.email)}
                          </p>
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            {person.gift_message || 'No message'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant={person.access_type === 'lifetime' ? 'default' : 'secondary'}>
                          {person.access_type} access
                        </Badge>
                        <p className="text-xs text-slate-500 mt-1">
                          Claimed {formatDistanceToNow(new Date(person.claimed_at), { addSuffix: true })}
                        </p>
                        <p className="text-xs text-slate-500">
                          via {person.claim_method === 'individual' ? 'personal gift' : 'shareable link'}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="claims" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-slate-900 dark:text-white">
              All Gift Claims
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Complete history of your gift credits
            </p>
          </div>

          <div className="space-y-4">
            {detailedCredits.flatMap(credit => 
              credit.individual_claims.map(claim => ({
                ...claim,
                source_donation: credit.source_donation_amount
              }))
            ).map((claim) => (
              <Card key={claim.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className={`h-4 w-4 rounded-full ${
                        claim.redemption_status === 'claimed' ? 'bg-green-500' :
                        claim.redemption_status === 'expired' ? 'bg-red-500' : 'bg-yellow-500'
                      }`} />
                      <div>
                        <p className="font-medium text-slate-900 dark:text-white">
                          {maskEmail(claim.recipient_email)}
                        </p>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          From your {formatCurrency(claim.source_donation)} donation
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center space-x-2 mb-1">
                        <Badge variant={claim.access_type === 'lifetime' ? 'default' : 'secondary'}>
                          {claim.access_type}
                        </Badge>
                        <Badge variant={
                          claim.redemption_status === 'claimed' ? 'default' :
                          claim.redemption_status === 'expired' ? 'destructive' : 'secondary'
                        }>
                          {claim.redemption_status}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-500">
                        {claim.redemption_status === 'claimed' && claim.claimed_at ? 
                          `Claimed ${formatDistanceToNow(new Date(claim.claimed_at), { addSuffix: true })}` :
                          `Sent ${formatDistanceToNow(new Date(claim.created_at), { addSuffix: true })}`
                        }
                      </p>
                      <p className="text-xs text-slate-500">
                        Code: {claim.redemption_code}
                      </p>
                    </div>
                  </div>
                  {claim.gift_message && (
                    <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
                      <p className="text-sm text-slate-700 dark:text-slate-300">
                        "{claim.gift_message}"
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
} 