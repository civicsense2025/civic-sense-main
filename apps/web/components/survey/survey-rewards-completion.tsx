// ============================================================================
// SURVEY REWARDS COMPLETION COMPONENT
// ============================================================================
// Handles claiming rewards when users complete surveys

'use client'

import React, { useState, useEffect } from 'react'
import { Gift, Sparkles, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Alert, AlertDescription } from './ui/alert'
import { Separator } from './ui/separator'
import { SurveyIncentiveDisplay } from './survey-incentive-display'
import { useAuth } from '@civicsense/ui-web'
import { useGuestAccess } from '@civicsense/shared/use-guest-access'
import { useSurveyIncentive } from '@civicsense/shared/use-survey-incentives'
import { cn } from '@civicsense/business-logic/utils'
import type { 
  SurveyIncentive, 
  ClaimSurveyRewardsResponse,
  RaffleEntry,
  UserCredit,
  DiscountCode 
} from '@civicsense/types/incentives'

// ============================================================================
// TYPES
// ============================================================================

interface SurveyRewardsCompletionProps {
  surveyId: string
  surveyTitle: string
  surveyResponseId: string
  className?: string
  onRewardsClaimed?: (result: ClaimSurveyRewardsResponse) => void
}

interface ClaimedRewardsDisplayProps {
  result: ClaimSurveyRewardsResponse
  incentive: SurveyIncentive
}

// ============================================================================
// CLAIMED REWARDS DISPLAY
// ============================================================================

function ClaimedRewardsDisplay({ result, incentive }: ClaimedRewardsDisplayProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2 text-green-600">
        <CheckCircle2 className="h-5 w-5" />
        <span className="font-medium">Rewards Claimed Successfully!</span>
      </div>
      
      {result.messages.map((message, index) => (
        <Alert key={index} className="border-green-200 bg-green-50">
          <Sparkles className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            {message}
          </AlertDescription>
        </Alert>
      ))}
      
      {/* Raffle entries */}
      {result.raffle_entries.length > 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-blue-800">🎟️ Raffle Entry</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {result.raffle_entries.map((entry: RaffleEntry, index) => (
              <div key={index} className="text-sm">
                <p className="font-mono text-blue-900">Ticket: {entry.ticket_code}</p>
                <p className="text-blue-700">Entry #{entry.entry_number}</p>
                {incentive.raffle_config?.draw_date && (
                  <p className="text-blue-600">
                    Draw Date: {new Date(incentive.raffle_config.draw_date).toLocaleDateString()}
                  </p>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
      
      {/* Credits awarded */}
      {result.credits_awarded.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-yellow-800">💰 Credits Earned</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {result.credits_awarded.map((credit: UserCredit, index) => (
              <div key={index} className="text-sm">
                <p className="font-medium text-yellow-900">
                  +{credit.amount} {credit.currency}
                </p>
                {credit.expires_at && (
                  <p className="text-yellow-700">
                    Expires: {new Date(credit.expires_at).toLocaleDateString()}
                  </p>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
      
      {/* Discount codes */}
      {result.discount_codes.length > 0 && (
        <Card className="border-purple-200 bg-purple-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-purple-800">🎁 Discount Code</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {result.discount_codes.map((discount: DiscountCode, index) => (
              <div key={index} className="text-sm">
                <p className="font-mono text-lg font-bold text-purple-900">
                  {discount.code}
                </p>
                <p className="text-purple-700">
                  {discount.discount_value}
                  {discount.discount_type === 'percentage' ? '% off' : ` ${discount.currency} off`}
                </p>
                {discount.valid_until && (
                  <p className="text-purple-600">
                    Valid until: {new Date(discount.valid_until).toLocaleDateString()}
                  </p>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
      
      {/* Premium access */}
      {result.premium_access_granted && (
        <Card className="border-gold-200 bg-gradient-to-br from-yellow-50 to-orange-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-orange-800">⭐ Premium Access</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            <p className="font-medium text-orange-900">
              {result.premium_access_granted.type} access activated!
            </p>
            {result.premium_access_granted.duration_months && (
              <p className="text-orange-700">
                Duration: {result.premium_access_granted.duration_months} months
              </p>
            )}
            {result.premium_access_granted.expires_at && (
              <p className="text-orange-600">
                Expires: {new Date(result.premium_access_granted.expires_at).toLocaleDateString()}
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function SurveyRewardsCompletion({
  surveyId,
  surveyTitle,
  surveyResponseId,
  className,
  onRewardsClaimed
}: SurveyRewardsCompletionProps) {
  const { user } = useAuth()
  const { getOrCreateGuestToken } = useGuestAccess()
  const { incentive, loading: incentiveLoading } = useSurveyIncentive(surveyId)
  
  const [claiming, setClaiming] = useState(false)
  const [claimed, setClaimed] = useState(false)
  const [claimResult, setClaimResult] = useState<ClaimSurveyRewardsResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Check if rewards can be claimed
  const canClaim = incentive && 
    incentive.enabled && 
    incentive.show_on_completion &&
    (!incentive.valid_until || new Date(incentive.valid_until) > new Date()) &&
    (!incentive.max_rewards || incentive.rewards_given < incentive.max_rewards) &&
    (!incentive.authenticated_only || user)

  // Handle claiming rewards
  const handleClaimRewards = async () => {
    if (!incentive || !canClaim) return
    
    setClaiming(true)
    setError(null)
    
    try {
      const response = await fetch('/api/surveys/claim-rewards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          survey_response_id: surveyResponseId,
          survey_incentive_id: incentive.id,
          user_id: user?.id,
          // For guest users, we could collect contact info here
        })
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to claim rewards')
      }
      
      const result = await response.json()
      
      if (result.success) {
        setClaimResult(result)
        setClaimed(true)
        onRewardsClaimed?.(result)
      } else {
        throw new Error(result.error || 'Failed to claim rewards')
      }
    } catch (err) {
      console.error('Error claiming rewards:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setClaiming(false)
    }
  }

  // Show loading state
  if (incentiveLoading) {
    return (
      <Card className={cn("", className)}>
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          <span className="ml-2 text-gray-600">Checking for rewards...</span>
        </CardContent>
      </Card>
    )
  }

  // Don't show if no incentive or not configured to show on completion
  if (!incentive || !incentive.show_on_completion) {
    return null
  }

  // Show claimed rewards
  if (claimed && claimResult) {
    return (
      <Card className={cn("border-green-200 bg-green-50", className)}>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Gift className="h-5 w-5 text-green-600" />
            <span>Survey Rewards</span>
            <Badge variant="secondary" className="bg-green-100 text-green-700">
              Claimed
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ClaimedRewardsDisplay result={claimResult} incentive={incentive} />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn("border-blue-200 bg-blue-50", className)}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Gift className="h-5 w-5 text-blue-600" />
          <span>Congratulations! You've earned rewards</span>
          {!canClaim && (
            <Badge variant="secondary" className="bg-yellow-100 text-yellow-700">
              Limited
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Show incentive details */}
        <SurveyIncentiveDisplay
          incentive={incentive}
          showDetails={true}
          showClaimButton={false}
          className="border-0 bg-transparent p-0 shadow-none"
        />
        
        <Separator />
        
        {/* Error display */}
        {error && (
          <Alert className="border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              {error}
            </AlertDescription>
          </Alert>
        )}
        
        {/* Claim button or reasons why can't claim */}
        {canClaim ? (
          <Button
            onClick={handleClaimRewards}
            disabled={claiming}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            size="lg"
          >
            {claiming ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Claiming Rewards...
              </>
            ) : (
              <>
                <Gift className="h-4 w-4 mr-2" />
                Claim Your Rewards
              </>
            )}
          </Button>
        ) : (
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">
              {!incentive.enabled && 'Rewards are currently disabled'}
              {incentive.authenticated_only && !user && 'Sign in required to claim rewards'}
              {incentive.valid_until && new Date(incentive.valid_until) <= new Date() && 'Reward offer has expired'}
              {incentive.max_rewards && incentive.rewards_given >= incentive.max_rewards && 'Maximum rewards limit reached'}
            </p>
            
            {incentive.authenticated_only && !user && (
              <Button variant="outline" className="mt-3" size="sm">
                Sign In to Claim
              </Button>
            )}
          </div>
        )}
        
        {/* Additional info */}
        {canClaim && (
          <div className="text-xs text-blue-600 text-center">
            <p>By claiming rewards, you agree to our terms and conditions.</p>
            {incentive.authenticated_only && !user && (
              <p className="mt-1">Account creation may be required for some rewards.</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
} 