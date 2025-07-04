export type PremiumFeature = 
  | 'advanced_analytics'
  | 'custom_decks'
  | 'multiplayer'
  | 'ai_battles'
  | 'offline_mode'
  | 'priority_support'

export interface PremiumTier {
  name: string
  features: PremiumFeature[]
  price: number
  billingPeriod: 'monthly' | 'yearly'
} 