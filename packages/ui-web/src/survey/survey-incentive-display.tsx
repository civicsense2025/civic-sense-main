// ============================================================================
// SURVEY INCENTIVE DISPLAY COMPONENT
// ============================================================================
// Shows incentives available for completing surveys

'use client'

import React, { useState } from 'react'
import { Gift, Trophy, CreditCard, Star, Calendar, Users } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { Separator } from '../ui/separator'
import type { 
  SurveyIncentive, 
  IncentiveDisplayProps,
  RaffleConfig,
  CreditsConfig,
  PremiumConfig,
  DiscountConfig 
} from '@civicsense/shared/types/incentives'

// ============================================================================
// INCENTIVE TYPE COMPONENTS
// ============================================================================

/**
 * Displays raffle incentive details
 */
function RaffleIncentiveCard({ config }: { config: RaffleConfig }) {
  return (
    <div className="flex items-center space-x-3 p-3 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200">
      <Trophy className="h-8 w-8 text-yellow-600" />
      <div className="flex-1">
        <h4 className="font-semibold text-yellow-800">{config.prize}</h4>
        {config.prize_value && (
          <p className="text-sm text-yellow-700">Value: {config.prize_value}</p>
        )}
        <div className="flex items-center space-x-4 text-sm text-yellow-600 mt-1">
          <span className="flex items-center">
            <Users className="h-4 w-4 mr-1" />
            {config.total_winners} winner{config.total_winners > 1 ? 's' : ''}
          </span>
          <span className="flex items-center">
            <Calendar className="h-4 w-4 mr-1" />
            Draw: {new Date(config.draw_date).toLocaleDateString()}
          </span>
        </div>
        {config.description && (
          <p className="text-sm text-yellow-700 mt-1">{config.description}</p>
        )}
      </div>
    </div>
  )
}

/**
 * Displays credits incentive details
 */
function CreditsIncentiveCard({ config }: { config: CreditsConfig }) {
  return (
    <div className="flex items-center space-x-3 p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
      <CreditCard className="h-8 w-8 text-green-600" />
      <div className="flex-1">
        <h4 className="font-semibold text-green-800">
          Earn {config.amount} {config.currency.replace('_', ' ')}
        </h4>
        {config.description && (
          <p className="text-sm text-green-700">{config.description}</p>
        )}
        {config.expires_days && (
          <p className="text-xs text-green-600 mt-1">
            Valid for {config.expires_days} days
          </p>
        )}
      </div>
    </div>
  )
}

/**
 * Displays premium access incentive details
 */
function PremiumIncentiveCard({ config }: { config: PremiumConfig }) {
  return (
    <div className="flex items-center space-x-3 p-3 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg border border-purple-200">
      <Star className="h-8 w-8 text-purple-600" />
      <div className="flex-1">
        <h4 className="font-semibold text-purple-800">
          {config.tier.charAt(0).toUpperCase() + config.tier.slice(1)} Access
        </h4>
        {config.duration_months ? (
          <p className="text-sm text-purple-700">
            {config.duration_months} month{config.duration_months > 1 ? 's' : ''} of premium features
          </p>
        ) : (
          <p className="text-sm text-purple-700">Lifetime access</p>
        )}
        {config.description && (
          <p className="text-sm text-purple-700 mt-1">{config.description}</p>
        )}
        {config.features && config.features.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {config.features.slice(0, 3).map((feature, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {feature}
              </Badge>
            ))}
            {config.features.length > 3 && (
              <Badge variant="secondary" className="text-xs">
                +{config.features.length - 3} more
              </Badge>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * Displays discount incentive details
 */
function DiscountIncentiveCard({ config }: { config: DiscountConfig }) {
  const discountText = config.percentage 
    ? `${config.percentage}% off`
    : `${config.fixed_amount} ${config.currency} off`
  
  return (
    <div className="flex items-center space-x-3 p-3 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg border border-blue-200">
      <Gift className="h-8 w-8 text-blue-600" />
      <div className="flex-1">
        <h4 className="font-semibold text-blue-800">
          {discountText} discount code
        </h4>
        {config.description && (
          <p className="text-sm text-blue-700">{config.description}</p>
        )}
        <div className="flex flex-wrap gap-1 mt-2">
          {config.applies_to.slice(0, 2).map((product, index) => (
            <Badge key={index} variant="outline" className="text-xs text-blue-600">
              {product.replace('_', ' ')}
            </Badge>
          ))}
          {config.applies_to.length > 2 && (
            <Badge variant="outline" className="text-xs text-blue-600">
              +{config.applies_to.length - 2} more
            </Badge>
          )}
        </div>
        <p className="text-xs text-blue-600 mt-1">
          Valid for {config.valid_days} days
        </p>
      </div>
    </div>
  )
}

// ============================================================================
// MAIN INCENTIVE DISPLAY COMPONENT
// ============================================================================

/**
 * Main component for displaying survey incentives
 */
export function SurveyIncentiveDisplay({
  incentive,
  showDetails = true,
  showClaimButton = false,
  onClaim,
  className = ''
}: IncentiveDisplayProps) {
  const [showFullDescription, setShowFullDescription] = useState(false)
  
  // Check if incentive is still valid
  const isExpired = incentive.valid_until && new Date(incentive.valid_until) < new Date()
  const isActive = incentive.enabled && !isExpired
  
  // Check if rewards are available
  const rewardsAvailable = !incentive.max_rewards || incentive.rewards_given < incentive.max_rewards
  const remainingRewards = incentive.max_rewards ? incentive.max_rewards - incentive.rewards_given : null
  
  return (
    <Card className={`${className} ${!isActive ? 'opacity-60' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold text-gray-900">
              {incentive.title}
            </CardTitle>
            
            {/* Status badges */}
            <div className="flex items-center space-x-2 mt-2">
              {isActive ? (
                <Badge variant="default" className="bg-green-100 text-green-800">
                  Active
                </Badge>
              ) : (
                <Badge variant="secondary" className="bg-gray-100 text-gray-600">
                  {isExpired ? 'Expired' : 'Inactive'}
                </Badge>
              )}
              
              {incentive.completion_required && (
                <Badge variant="outline" className="text-xs">
                  Complete Survey Required
                </Badge>
              )}
              
              {incentive.authenticated_only && (
                <Badge variant="outline" className="text-xs">
                  Account Required
                </Badge>
              )}
            </div>
          </div>
          
          {/* Incentive type icons */}
          <div className="flex items-center space-x-1">
            {incentive.incentive_types.includes('raffle') && (
              <Trophy className="h-5 w-5 text-yellow-600" title="Raffle Entry" />
            )}
            {incentive.incentive_types.includes('credits') && (
              <CreditCard className="h-5 w-5 text-green-600" title="Credits" />
            )}
            {incentive.incentive_types.includes('premium_access') && (
              <Star className="h-5 w-5 text-purple-600" title="Premium Access" />
            )}
            {incentive.incentive_types.includes('discount') && (
              <Gift className="h-5 w-5 text-blue-600" title="Discount Code" />
            )}
          </div>
        </div>
        
        {/* Description */}
        {incentive.description && (
          <div className="mt-3">
            <p className="text-sm text-gray-600">
              {showFullDescription || incentive.description.length <= 150
                ? incentive.description
                : `${incentive.description.substring(0, 150)}...`}
              {incentive.description.length > 150 && (
                <button
                  onClick={() => setShowFullDescription(!showFullDescription)}
                  className="text-blue-600 hover:text-blue-800 ml-1 text-xs"
                >
                  {showFullDescription ? 'Show less' : 'Show more'}
                </button>
              )}
            </p>
          </div>
        )}
      </CardHeader>
      
      {showDetails && (
        <CardContent className="pt-0">
          <div className="space-y-4">
            
            {/* Raffle Details */}
            {incentive.incentive_types.includes('raffle') && incentive.raffle_config && (
              <RaffleIncentiveCard config={incentive.raffle_config} />
            )}
            
            {/* Credits Details */}
            {incentive.incentive_types.includes('credits') && incentive.credits_config && (
              <CreditsIncentiveCard config={incentive.credits_config} />
            )}
            
            {/* Premium Access Details */}
            {incentive.incentive_types.includes('premium_access') && incentive.premium_config && (
              <PremiumIncentiveCard config={incentive.premium_config} />
            )}
            
            {/* Discount Details */}
            {incentive.incentive_types.includes('discount') && incentive.discount_config && (
              <DiscountIncentiveCard config={incentive.discount_config} />
            )}
            
            {/* Availability info */}
            {(remainingRewards !== null || !rewardsAvailable) && (
              <>
                <Separator />
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Availability:</span>
                  {rewardsAvailable ? (
                    <span className="text-green-600">
                      {remainingRewards !== null 
                        ? `${remainingRewards} left`
                        : 'Unlimited'
                      }
                    </span>
                  ) : (
                    <span className="text-red-600">No longer available</span>
                  )}
                </div>
              </>
            )}
            
            {/* Validity period */}
            {(incentive.valid_until || incentive.valid_from !== incentive.created_at) && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Valid:</span>
                <span className="text-gray-700">
                  {incentive.valid_from !== incentive.created_at && (
                    <>From {new Date(incentive.valid_from).toLocaleDateString()}</>
                  )}
                  {incentive.valid_until && (
                    <> until {new Date(incentive.valid_until).toLocaleDateString()}</>
                  )}
                  {!incentive.valid_until && incentive.valid_from === incentive.created_at && (
                    <>No expiration</>
                  )}
                </span>
              </div>
            )}
            
            {/* Claim button */}
            {showClaimButton && isActive && rewardsAvailable && onClaim && (
              <>
                <Separator />
                <Button 
                  onClick={onClaim}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  size="lg"
                >
                  Complete Survey to Claim Rewards
                </Button>
              </>
            )}
            
            {/* Warning messages */}
            {showClaimButton && (!isActive || !rewardsAvailable) && (
              <>
                <Separator />
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">
                    {!isActive 
                      ? (isExpired ? 'This incentive has expired' : 'This incentive is not currently active')
                      : 'No more rewards available'
                    }
                  </p>
                </div>
              </>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  )
}

// ============================================================================
// COMPACT INCENTIVE PREVIEW
// ============================================================================

/**
 * Compact version for showing in survey headers/previews
 */
export function SurveyIncentivePreview({ 
  incentive, 
  className = '' 
}: { 
  incentive: SurveyIncentive
  className?: string 
}) {
  const isActive = incentive.enabled && 
    (!incentive.valid_until || new Date(incentive.valid_until) > new Date())
  
  if (!isActive) return null
  
  return (
    <div className={`flex items-center space-x-2 p-2 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200 ${className}`}>
      <Gift className="h-5 w-5 text-blue-600" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-blue-800 truncate">
          {incentive.title}
        </p>
        <div className="flex items-center space-x-1">
          {incentive.incentive_types.includes('raffle') && (
            <Badge variant="secondary" className="text-xs">🎟️ Raffle</Badge>
          )}
          {incentive.incentive_types.includes('credits') && (
            <Badge variant="secondary" className="text-xs">💰 Credits</Badge>
          )}
          {incentive.incentive_types.includes('premium_access') && (
            <Badge variant="secondary" className="text-xs">⭐ Premium</Badge>
          )}
          {incentive.incentive_types.includes('discount') && (
            <Badge variant="secondary" className="text-xs">🎁 Discount</Badge>
          )}
        </div>
      </div>
    </div>
  )
}

export default SurveyIncentiveDisplay 