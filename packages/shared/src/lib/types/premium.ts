export type PremiumFeature = 
  | 'multiplayer_quiz'
  | 'npc_battle'
  | 'advanced_analytics'
  | 'custom_quizzes'
  | 'team_features'
  | 'priority_support'

export interface PremiumFeatureConfig {
  name: string
  description: string
  icon: string
  tier: 'basic' | 'premium' | 'pro'
}

export const PREMIUM_FEATURES: Record<PremiumFeature, PremiumFeatureConfig> = {
  multiplayer_quiz: {
    name: 'Multiplayer Quiz',
    description: 'Challenge friends and classmates in real-time multiplayer quizzes',
    icon: '🎮',
    tier: 'premium'
  },
  npc_battle: {
    name: 'NPC Battle',
    description: 'Test your knowledge against AI-powered opponents',
    icon: '🤖',
    tier: 'premium'
  },
  advanced_analytics: {
    name: 'Advanced Analytics',
    description: 'Get detailed insights into your learning progress',
    icon: '📊',
    tier: 'premium'
  },
  custom_quizzes: {
    name: 'Custom Quizzes',
    description: 'Create and share your own custom quizzes',
    icon: '✏️',
    tier: 'premium'
  },
  team_features: {
    name: 'Team Features',
    description: 'Collaborate and compete with your team',
    icon: '👥',
    tier: 'pro'
  },
  priority_support: {
    name: 'Priority Support',
    description: 'Get priority access to our support team',
    icon: '🎯',
    tier: 'pro'
  }
} 