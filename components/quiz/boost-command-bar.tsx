"use client"

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { ShoppingCart, Zap, Clock, Shield, Target, Users, BookOpen, Star } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/components/auth/auth-provider'
import { useAnalytics } from '@/utils/analytics'
import { 
  BoostManager, 
  type BoostType, 
  type GameBoost, 
  type ActiveBoost, 
  type BoostEffects,
  calculateBoostEffects,
  BOOST_DEFINITIONS
} from '@/lib/game-boosts'

interface BoostCommandBarProps {
  userXP: number
  userLevel?: number
  onXPChanged: (newXP: number) => void
  onBoostActivated: (effects: BoostEffects) => void
  className?: string
}

// Category icons mapping
const CATEGORY_ICONS = {
  time: Clock,
  scoring: Star,
  assistance: BookOpen,
  protection: Shield,
  strategic: Target,
  social: Users,
  learning: BookOpen
} as const

// Rarity colors mapping
const RARITY_COLORS = {
  common: 'bg-gray-100 text-gray-800 border-gray-200',
  uncommon: 'bg-green-100 text-green-800 border-green-200',
  rare: 'bg-blue-100 text-blue-800 border-blue-200',
  epic: 'bg-purple-100 text-purple-800 border-purple-200',
  legendary: 'bg-orange-100 text-orange-800 border-orange-200',
  mythic: 'bg-red-100 text-red-800 border-red-200'
} as const

export function BoostCommandBar({ userXP, userLevel = 1, onXPChanged, onBoostActivated, className }: BoostCommandBarProps) {
  const { user } = useAuth()
  const { trackGameification } = useAnalytics()
  const [boostManager] = useState(() => BoostManager.getInstance())
  const [userBoosts, setUserBoosts] = useState<Array<{ type: BoostType; quantity: number; boost: GameBoost }>>([])
  const [activeBoosts, setActiveBoosts] = useState<ActiveBoost[]>([])
  const [isStoreOpen, setIsStoreOpen] = useState(false)

  useEffect(() => {
    if (user) {
      boostManager.initialize(user.id)
      loadBoosts()
    }
  }, [user])

  const loadBoosts = () => {
    const boosts = boostManager.getAllUserBoosts()
    const active = boostManager.getActiveBoosts()
    setUserBoosts(boosts)
    setActiveBoosts(active)
    
    // Clear expired boosts
    if (user) {
      boostManager.clearExpiredBoosts(user.id)
    }
  }

  const handlePurchaseBoost = (boostType: BoostType) => {
    if (!user) return
    
    const boost = BOOST_DEFINITIONS[boostType]
    
    // Check level requirement
    if (boost.levelRequirement && userLevel < boost.levelRequirement) {
      alert(`You need to reach level ${boost.levelRequirement} to unlock this boost!`)
      return
    }
    
    const result = boostManager.purchaseBoost(user.id, boostType, userXP)
    if (result.success && result.newXpBalance !== undefined) {
      // Track boost purchase
      trackGameification.boostPurchased({
        boost_type: boostType,
        boost_cost_xp: boost.xpCost,
        user_level: userLevel,
        user_xp_before: userXP,
        purchase_context: 'browse'
      })
      
      onXPChanged(result.newXpBalance)
      loadBoosts()
      console.log(`✅ Purchased ${boost.name}!`)
    } else {
      alert(result.error || 'Purchase failed')
    }
  }

  const handleActivateBoost = (boostType: BoostType) => {
    if (!user) return
    
    const result = boostManager.activateBoost(user.id, boostType)
    if (result.success && result.activeBoost) {
      // Track boost activation
      trackGameification.boostActivated({
        boost_type: boostType,
        activation_context: 'browse',
        user_level: userLevel,
        remaining_uses: result.activeBoost.usesRemaining || 0
      })
      
      loadBoosts()
      
      // Calculate and apply boost effects
      const newActiveBoosts = boostManager.getActiveBoosts()
      const effects = calculateBoostEffects(newActiveBoosts)
      onBoostActivated(effects)
      
      const boost = BOOST_DEFINITIONS[boostType]
      console.log(`🚀 Activated ${boost.name}!`)
    } else {
      alert(result.error || 'Activation failed')
    }
  }

  const getRarityColor = (rarity: GameBoost['rarity']) => {
    return RARITY_COLORS[rarity] || RARITY_COLORS.common
  }

  const getActiveBoostCountdown = (boost: ActiveBoost): string => {
    if (boost.usesRemaining !== undefined) {
      return `${boost.usesRemaining} uses left`
    }
    if (boost.duration) {
      const startTime = new Date(boost.startedAt).getTime()
      const elapsed = Date.now() - startTime
      const remaining = Math.max(0, boost.duration * 60000 - elapsed) // duration in minutes
      const minutes = Math.floor(remaining / 60000)
      const seconds = Math.floor((remaining % 60000) / 1000)
      return `${minutes}:${seconds.toString().padStart(2, '0')}`
    }
    return 'Active'
  }

  const getCategoryIcon = (category: GameBoost['category']) => {
    const IconComponent = CATEGORY_ICONS[category]
    return IconComponent ? <IconComponent className="h-4 w-4" /> : <Star className="h-4 w-4" />
  }

  const getAvailableBoostsForUser = () => {
    return Object.values(BOOST_DEFINITIONS).filter(boost => 
      !boost.levelRequirement || userLevel >= boost.levelRequirement
    )
  }

  const getBoostsByCategory = () => {
    const availableBoosts = getAvailableBoostsForUser()
    const categories = ['time', 'scoring', 'assistance', 'protection', 'strategic', 'social', 'learning'] as const
    
    return categories.reduce((acc, category) => {
      acc[category] = availableBoosts.filter(boost => boost.category === category)
      return acc
    }, {} as Record<string, GameBoost[]>)
  }

  if (!user) return null

  return (
    <div className={cn("mt-6 mb-20", className)}>
      {/* Active Boosts Display */}
      {activeBoosts.length > 0 && (
        <div className="mb-2 space-y-1">
          {activeBoosts.map((activeBoost) => {
            const boost = BOOST_DEFINITIONS[activeBoost.type]
            return (
              <div
                key={activeBoost.type}
                className="flex items-center gap-2 bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm border border-green-200"
              >
                <span className="text-lg">{boost.emoji}</span>
                <span className="font-medium">{boost.name}</span>
                <span className="text-xs opacity-75">
                  {getActiveBoostCountdown(activeBoost)}
                </span>
              </div>
            )
          })}
        </div>
      )}

      {/* User Boosts Inventory */}
      {userBoosts.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1 max-w-xs">
          {userBoosts.map(({ type, quantity, boost }) => (
            <Button
              key={type}
              variant="outline"
              size="sm"
              onClick={() => handleActivateBoost(type)}
              disabled={boostManager.hasActiveBoost(type)}
              className="relative h-12 w-12 p-0 hover:scale-105 transition-transform"
            >
              <div className="flex flex-col items-center">
                <span className="text-lg">{boost.emoji}</span>
                <Badge 
                  variant="secondary" 
                  className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs rounded-full"
                >
                  {quantity}
                </Badge>
              </div>
            </Button>
          ))}
        </div>
      )}

      {/* Boost Store Button */}
      <Dialog open={isStoreOpen} onOpenChange={setIsStoreOpen}>
        <DialogTrigger asChild>
          <Button 
            className="relative border-2 border-transparent bg-white dark:bg-slate-900 text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800 shadow-sm"
            size="lg"
          >
            <div className="absolute inset-0 rounded-md bg-gradient-to-r from-purple-600 to-blue-600 -z-10"></div>
            <div className="absolute inset-[2px] rounded-md bg-white dark:bg-slate-900 -z-[5]"></div>
            <ShoppingCart className="mr-2 h-4 w-4" />
            Boost Store
            <Badge variant="secondary" className="ml-2">
              {userXP} XP
            </Badge>
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-500" />
              Boost Store
            </DialogTitle>
            <DialogDescription>
              Enhance your quiz experience with powerful boosts! You have {userXP} XP to spend.
            </DialogDescription>
          </DialogHeader>
          
          <BoostStore 
            userXP={userXP} 
            userLevel={userLevel}
            onPurchase={handlePurchaseBoost} 
            boostManager={boostManager}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}

interface BoostStoreProps {
  userXP: number
  userLevel: number
  onPurchase: (boostType: BoostType) => void
  boostManager: BoostManager
}

function BoostStore({ userXP, userLevel, onPurchase, boostManager }: BoostStoreProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  
  const getRarityGradient = (rarity: GameBoost['rarity']) => {
    const gradients = {
      common: 'from-gray-50 to-gray-100',
      uncommon: 'from-green-50 to-green-100',
      rare: 'from-blue-50 to-blue-100',
      epic: 'from-purple-50 to-purple-100',
      legendary: 'from-orange-50 to-orange-100',
      mythic: 'from-red-50 to-red-100'
    }
    return gradients[rarity] || gradients.common
  }

  const getRarityColor = (rarity: GameBoost['rarity']) => {
    return RARITY_COLORS[rarity] || RARITY_COLORS.common
  }

  const getBoostsByCategory = () => {
    const availableBoosts = Object.values(BOOST_DEFINITIONS)
    const categories = ['time', 'scoring', 'assistance', 'protection', 'strategic', 'social', 'learning'] as const
    
    return categories.reduce((acc, category) => {
      acc[category] = availableBoosts.filter(boost => boost.category === category)
      return acc
    }, {} as Record<string, GameBoost[]>)
  }

  const boostsByCategory = getBoostsByCategory()
  const allBoosts = Object.values(BOOST_DEFINITIONS)
  const displayBoosts = selectedCategory === 'all' ? allBoosts : boostsByCategory[selectedCategory as keyof typeof boostsByCategory] || []

  return (
    <div className="space-y-4">
      {/* Category Tabs */}
      <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
        <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8">
          <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
          <TabsTrigger value="time" className="text-xs">
            <Clock className="h-3 w-3 mr-1" />
            Time
          </TabsTrigger>
          <TabsTrigger value="scoring" className="text-xs">
            <Star className="h-3 w-3 mr-1" />
            XP
          </TabsTrigger>
          <TabsTrigger value="assistance" className="text-xs">
            <BookOpen className="h-3 w-3 mr-1" />
            Help
          </TabsTrigger>
          <TabsTrigger value="protection" className="text-xs">
            <Shield className="h-3 w-3 mr-1" />
            Safety
          </TabsTrigger>
          <TabsTrigger value="strategic" className="text-xs">
            <Target className="h-3 w-3 mr-1" />
            Strategy
          </TabsTrigger>
          <TabsTrigger value="social" className="text-xs">
            <Users className="h-3 w-3 mr-1" />
            Social
          </TabsTrigger>
          <TabsTrigger value="learning" className="text-xs">
            <BookOpen className="h-3 w-3 mr-1" />
            Learn
          </TabsTrigger>
        </TabsList>

        <TabsContent value={selectedCategory} className="mt-4">
          <div className="max-h-[400px] overflow-y-auto pr-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {displayBoosts.map((boost) => {
                const userQuantity = boostManager.getUserBoostCount(boost.type)
                const canAfford = userXP >= boost.xpCost
                const meetsLevelReq = !boost.levelRequirement || userLevel >= boost.levelRequirement
                const canPurchase = canAfford && meetsLevelReq

                return (
                  <Card 
                    key={boost.id} 
                    className={cn(
                      "relative overflow-hidden transition-all duration-200 hover:shadow-md",
                      `bg-gradient-to-br ${getRarityGradient(boost.rarity)}`,
                      !canPurchase && "opacity-60"
                    )}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{boost.emoji}</span>
                          <div>
                            <CardTitle className="text-sm font-semibold">{boost.name}</CardTitle>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge className={cn("text-xs", getRarityColor(boost.rarity))}>
                                {boost.rarity}
                              </Badge>
                              {(boost.levelRequirement || 0) > 1 && (
                                <Badge variant="outline" className="text-xs">
                                  Lv.{boost.levelRequirement}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        {userQuantity > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            Owned: {userQuantity}
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <CardDescription className="text-xs mb-3 line-clamp-2">
                        {boost.description}
                      </CardDescription>
                      
                      {/* Boost Details */}
                      <div className="space-y-1 mb-3">
                        {boost.duration && (
                          <div className="text-xs text-muted-foreground">
                            Duration: {boost.duration} quiz{boost.duration > 1 ? 'zes' : ''}
                          </div>
                        )}
                        {boost.maxUses && (
                          <div className="text-xs text-muted-foreground">
                            Uses: {boost.maxUses} per activation
                          </div>
                        )}
                        {boost.cooldown && (
                          <div className="text-xs text-muted-foreground">
                            Cooldown: {boost.cooldown}h
                          </div>
                        )}
                        {boost.tags && boost.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {boost.tags.slice(0, 3).map(tag => (
                              <Badge key={tag} variant="outline" className="text-xs px-1 py-0">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>

                      <Separator className="my-2" />
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <Zap className="h-3 w-3 text-yellow-500" />
                          <span className="text-sm font-semibold">{boost.xpCost} XP</span>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => onPurchase(boost.type)}
                          disabled={!canPurchase}
                          className="text-xs"
                        >
                          {!meetsLevelReq ? `Level ${boost.levelRequirement}` : 
                           !canAfford ? 'Need XP' : 'Buy'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
} 