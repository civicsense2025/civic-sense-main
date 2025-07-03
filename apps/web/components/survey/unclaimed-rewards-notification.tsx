// ============================================================================
// UNCLAIMED REWARDS NOTIFICATION COMPONENT
// ============================================================================
// Shows a notification icon when users have unclaimed survey rewards

'use client'

import React, { useState, useEffect } from 'react'
import { Gift, X } from 'lucide-react'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from './ui/dropdown-menu'
import { cn } from '@civicsense/business-logic/utils'
import { useAuth } from '@civicsense/ui-web'
import { useGuestAccess } from '@civicsense/shared/use-guest-access'
import type { SurveyIncentive, RewardFulfillment } from '@civicsense/types/incentives'

// ============================================================================
// TYPES
// ============================================================================

interface UnclaimedReward {
  survey_response_id: string
  survey_id: string
  survey_title: string
  incentive: SurveyIncentive
  completed_at: string
  can_claim: boolean
  reason?: string
}

interface UnclaimedRewardsNotificationProps {
  className?: string
  onRewardClaimed?: () => void
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function UnclaimedRewardsNotification({
  className,
  onRewardClaimed
}: UnclaimedRewardsNotificationProps) {
  const { user } = useAuth()
  const { getOrCreateGuestToken } = useGuestAccess()
  const [unclaimedRewards, setUnclaimedRewards] = useState<UnclaimedReward[]>([])
  const [loading, setLoading] = useState(true)
  const [showDropdown, setShowDropdown] = useState(false)
  const [claimingRewards, setClaimingRewards] = useState<Set<string>>(new Set())

  // Fetch unclaimed rewards
  useEffect(() => {
    const fetchUnclaimedRewards = async () => {
      try {
        setLoading(true)
        
        const params = new URLSearchParams()
        if (user) {
          params.append('user_id', user.id)
        } else {
          const guestToken = getOrCreateGuestToken()
          params.append('guest_token', guestToken)
        }
        
        const response = await fetch(`/api/surveys/unclaimed-rewards?${params}`)
        
        if (response.ok) {
          const data = await response.json()
          setUnclaimedRewards(data.unclaimed_rewards || [])
        } else {
          console.error('Failed to fetch unclaimed rewards:', response.status)
        }
      } catch (error) {
        console.error('Error fetching unclaimed rewards:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchUnclaimedRewards()
  }, [user, getOrCreateGuestToken])

  // Claim rewards function
  const handleClaimRewards = async (reward: UnclaimedReward) => {
    if (!reward.can_claim) return
    
    setClaimingRewards(prev => new Set(prev).add(reward.survey_response_id))
    
    try {
      const response = await fetch('/api/surveys/claim-rewards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          survey_response_id: reward.survey_response_id,
          survey_incentive_id: reward.incentive.id,
          user_id: user?.id
        })
      })
      
      if (response.ok) {
        const result = await response.json()
        
        // Remove claimed reward from list
        setUnclaimedRewards(prev => 
          prev.filter(r => r.survey_response_id !== reward.survey_response_id)
        )
        
        // Show success message
        if (result.messages && result.messages.length > 0) {
          // You can add a toast notification here
          console.log('Rewards claimed:', result.messages.join(', '))
        }
        
        onRewardClaimed?.()
      } else {
        const error = await response.json()
        console.error('Failed to claim rewards:', error.error)
        // You can add error toast here
      }
    } catch (error) {
      console.error('Error claiming rewards:', error)
      // You can add error toast here
    } finally {
      setClaimingRewards(prev => {
        const newSet = new Set(prev)
        newSet.delete(reward.survey_response_id)
        return newSet
      })
    }
  }

  // Clear specific notification
  const handleDismissReward = async (surveyResponseId: string) => {
    try {
      const response = await fetch('/api/surveys/dismiss-reward-notification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          survey_response_id: surveyResponseId,
          user_id: user?.id
        })
      })
      
      if (response.ok) {
        setUnclaimedRewards(prev => 
          prev.filter(r => r.survey_response_id !== surveyResponseId)
        )
      }
    } catch (error) {
      console.error('Error dismissing reward notification:', error)
    }
  }

  // Don't show if no unclaimed rewards or still loading
  if (loading || unclaimedRewards.length === 0) {
    return null
  }

  return (
    <DropdownMenu open={showDropdown} onOpenChange={setShowDropdown}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "relative p-2 hover:bg-blue-50 hover:text-blue-700",
            className
          )}
        >
          <Gift className="h-5 w-5" />
          <Badge 
            className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center bg-red-500 text-white text-xs border-0"
          >
            {unclaimedRewards.length}
          </Badge>
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent 
        align="end" 
        className="w-80 p-0"
        sideOffset={8}
      >
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2">
              <Gift className="h-5 w-5 text-blue-600" />
              <span>Unclaimed Rewards</span>
              <Badge variant="secondary">
                {unclaimedRewards.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-3 max-h-80 overflow-y-auto">
            {unclaimedRewards.map((reward) => (
              <div 
                key={reward.survey_response_id}
                className="border rounded-lg p-3 space-y-2"
              >
                {/* Survey info */}
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-sm line-clamp-1">
                      {reward.survey_title}
                    </h4>
                    <p className="text-xs text-gray-600">
                      Completed {new Date(reward.completed_at).toLocaleDateString()}
                    </p>
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 hover:bg-gray-100"
                    onClick={() => handleDismissReward(reward.survey_response_id)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
                
                {/* Incentive preview */}
                <div className="text-xs text-gray-700">
                  <p className="font-medium">{reward.incentive.title}</p>
                  {reward.incentive.description && (
                    <p className="line-clamp-2">{reward.incentive.description}</p>
                  )}
                </div>
                
                {/* Claim button */}
                {reward.can_claim ? (
                  <Button
                    size="sm"
                    className="w-full text-xs"
                    onClick={() => handleClaimRewards(reward)}
                    disabled={claimingRewards.has(reward.survey_response_id)}
                  >
                    {claimingRewards.has(reward.survey_response_id) 
                      ? 'Claiming...' 
                      : 'Claim Rewards'
                    }
                  </Button>
                ) : (
                  <div className="text-xs text-gray-500 text-center p-2 bg-gray-50 rounded">
                    {reward.reason || 'Cannot claim at this time'}
                  </div>
                )}
              </div>
            ))}
            
            {/* Clear all button */}
            {unclaimedRewards.length > 1 && (
              <div className="pt-2 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-xs"
                  onClick={() => {
                    unclaimedRewards.forEach(reward => {
                      if (reward.can_claim) {
                        handleDismissReward(reward.survey_response_id)
                      }
                    })
                  }}
                >
                  Dismiss All
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// ============================================================================
// SIMPLIFIED NOTIFICATION BADGE (for smaller spaces)
// ============================================================================

interface RewardsNotificationBadgeProps {
  count: number
  onClick?: () => void
  className?: string
}

export function RewardsNotificationBadge({
  count,
  onClick,
  className
}: RewardsNotificationBadgeProps) {
  if (count === 0) return null
  
  return (
    <Button
      variant="ghost"
      size="sm"
      className={cn(
        "relative p-1 hover:bg-blue-50 hover:text-blue-700",
        className
      )}
      onClick={onClick}
    >
      <Gift className="h-4 w-4" />
      <Badge 
        className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center bg-red-500 text-white text-xs border-0"
      >
        {count > 9 ? '9+' : count}
      </Badge>
    </Button>
  )
} 