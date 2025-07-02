"use client"

// =============================================================================
// CIVICSENSE ENHANCED BOOST SYSTEM
// =============================================================================
// Comprehensive powerup system for quiz enhancement

// Expanded boost types with more useful powerups
export type BoostType = 
  // Time Management Boosts
  | 'extra_time'          // +30 seconds per question
  | 'time_freeze'         // Pause timer for 10 seconds
  | 'speed_boost'         // +50% XP for completing under time limit
  | 'time_bank'           // Save unused time for later questions
  | 'rush_mode'           // Double XP but half time (risk/reward)
  
  // Scoring & XP Boosts  
  | 'double_xp'           // 2x XP for this quiz
  | 'triple_xp'           // 3x XP for this quiz (rare)
  | 'perfect_bonus'       // +100% XP if you get 100% score
  | 'comeback_king'       // Extra XP for each correct answer after wrong one
  | 'first_try_bonus'     // +25% XP for first-attempt correct answers
  
  // Learning Assistance Boosts
  | 'auto_hint'           // Automatically show hints on wrong answers
  | 'smart_hint'          // AI-powered contextual hints
  | 'answer_reveal'       // Eliminate one wrong answer in multiple choice
  | 'category_insight'    // Show which civic category each question tests
  | 'explanation_preview' // See explanation before answering (no XP penalty)
  | 'concept_map'         // Visual connections between questions and concepts
  
  // Protection & Safety Boosts
  | 'second_chance'       // Get one retry on wrong answers
  | 'streak_shield'       // Protect your streak from one wrong answer
  | 'mistake_forgiveness' // First wrong answer doesn't count
  | 'confidence_boost'    // Wrong answers don't reduce confidence score
  | 'safety_net'          // Minimum 50% score guaranteed
  
  // Strategic & Advanced Boosts
  | 'lucky_guess'         // 50% chance to get correct answer on timeout/skip
  | 'question_preview'    // See next 3 questions before starting
  | 'difficulty_scout'    // See difficulty level of each question
  | 'skip_token'          // Skip one question without penalty (3 uses)
  | 'topic_mastery'       // +200% XP if you master the topic (90%+ score)
  | 'civic_scholar'       // Unlock bonus questions for extra XP
  
  // Social & Engagement Boosts
  | 'mentor_mode'         // Get encouraging messages during quiz
  | 'achievement_hunter'  // 2x progress toward achievements
  | 'daily_streak'        // Bonus XP for maintaining daily quiz streak
  | 'weekend_warrior'     // Extra XP on weekends
  | 'night_owl'           // Bonus XP for late-night quizzing (after 9 PM)
  
  // Specialized Learning Boosts
  | 'constitution_focus'  // Extra hints for constitutional questions
  | 'current_events'      // Bonus context for recent political developments
  | 'historical_context'  // Additional historical background for questions
  | 'local_connection'    // Connect federal topics to local implications
  | 'debate_prep'         // Practice articulating positions on civic issues

// Enhanced boost interface with emoji support
export interface GameBoost {
  id: string
  type: BoostType
  name: string
  description: string
  emoji: string // Primary emoji for the boost
  icon: string // Secondary icon (for backwards compatibility)
  xpCost: number
  category: 'time' | 'scoring' | 'assistance' | 'protection' | 'strategic' | 'social' | 'learning'
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic'
  duration?: number // for temporary boosts (in quizzes)
  maxUses?: number  // for limited-use boosts
  cooldown?: number // cooldown period in hours
  prerequisites?: BoostType[] // required boosts to unlock
  levelRequirement?: number // minimum user level to unlock
  tags: string[] // for filtering and search
}

export interface UserBoostInventory {
  userId: string
  boostType: BoostType
  quantity: number
  lastPurchased?: string
  totalPurchased: number
}

export interface ActiveBoost {
  type: BoostType
  startedAt: string
  duration?: number
  usesRemaining?: number
  data?: Record<string, any>
}

// =============================================================================
// EXPANDED BOOST DEFINITIONS
// =============================================================================

export const BOOST_DEFINITIONS: Record<BoostType, GameBoost> = {
  // TIME MANAGEMENT BOOSTS
  extra_time: {
    id: 'extra_time',
    type: 'extra_time',
    name: 'Extra Time',
    description: '+30 seconds per question for this quiz',
    emoji: '⏰',
    icon: '⏰',
    xpCost: 50,
    category: 'time',
    rarity: 'common',
    duration: 1,
    tags: ['time', 'beginner', 'helpful']
  },
  time_freeze: {
    id: 'time_freeze',
    type: 'time_freeze',
    name: 'Time Freeze',
    description: 'Freeze the timer for 10 seconds (3 uses)',
    emoji: '❄️',
    icon: '❄️',
    xpCost: 150,
    category: 'time',
    rarity: 'epic',
    maxUses: 3,
    tags: ['time', 'strategic', 'limited']
  },
  speed_boost: {
    id: 'speed_boost',
    type: 'speed_boost',
    name: 'Speed Boost',
    description: '+50% XP bonus for completing questions under time limit',
    emoji: '🚀',
    icon: '🚀',
    xpCost: 120,
    category: 'time',
    rarity: 'rare',
    duration: 1,
    tags: ['speed', 'bonus', 'challenge']
  },
  time_bank: {
    id: 'time_bank',
    type: 'time_bank',
    name: 'Time Bank',
    description: 'Save unused time from questions for later use',
    emoji: '🏦',
    icon: '🏦',
    xpCost: 200,
    category: 'time',
    rarity: 'epic',
    duration: 1,
    levelRequirement: 5,
    tags: ['time', 'strategic', 'advanced']
  },
  rush_mode: {
    id: 'rush_mode',
    type: 'rush_mode',
    name: 'Rush Mode',
    description: 'Double XP but half time limit - high risk, high reward!',
    emoji: '⚡',
    icon: '⚡',
    xpCost: 300,
    category: 'time',
    rarity: 'legendary',
    duration: 1,
    levelRequirement: 10,
    tags: ['risk', 'reward', 'expert', 'challenge']
  },

  // SCORING & XP BOOSTS
  double_xp: {
    id: 'double_xp',
    type: 'double_xp',
    name: 'Double XP',
    description: 'Earn 2x experience points for this quiz',
    emoji: '💎',
    icon: '⚡',
    xpCost: 100,
    category: 'scoring',
    rarity: 'rare',
    duration: 1,
    tags: ['xp', 'popular', 'valuable']
  },
  triple_xp: {
    id: 'triple_xp',
    type: 'triple_xp',
    name: 'Triple XP',
    description: 'Earn 3x experience points for this quiz',
    emoji: '💰',
    icon: '💰',
    xpCost: 250,
    category: 'scoring',
    rarity: 'legendary',
    duration: 1,
    cooldown: 24,
    levelRequirement: 15,
    tags: ['xp', 'rare', 'valuable', 'limited']
  },
  perfect_bonus: {
    id: 'perfect_bonus',
    type: 'perfect_bonus',
    name: 'Perfect Bonus',
    description: '+100% XP bonus if you achieve 100% score',
    emoji: '🎯',
    icon: '🎯',
    xpCost: 150,
    category: 'scoring',
    rarity: 'rare',
    duration: 1,
    tags: ['perfect', 'bonus', 'challenge']
  },
  comeback_king: {
    id: 'comeback_king',
    type: 'comeback_king',
    name: 'Comeback King',
    description: '+25% XP for each correct answer after a wrong one',
    emoji: '👑',
    icon: '👑',
    xpCost: 180,
    category: 'scoring',
    rarity: 'epic',
    duration: 1,
    tags: ['comeback', 'resilience', 'bonus']
  },
  first_try_bonus: {
    id: 'first_try_bonus',
    type: 'first_try_bonus',
    name: 'First Try Bonus',
    description: '+25% XP for first-attempt correct answers',
    emoji: '🥇',
    icon: '🥇',
    xpCost: 90,
    category: 'scoring',
    rarity: 'uncommon',
    duration: 1,
    tags: ['first', 'accuracy', 'bonus']
  },

  // LEARNING ASSISTANCE BOOSTS
  auto_hint: {
    id: 'auto_hint',
    type: 'auto_hint',
    name: 'Auto Hint',
    description: 'Automatically show hints on wrong answers',
    emoji: '💡',
    icon: '💡',
    xpCost: 75,
    category: 'assistance',
    rarity: 'common',
    duration: 1,
    tags: ['hint', 'learning', 'helpful']
  },
  smart_hint: {
    id: 'smart_hint',
    type: 'smart_hint',
    name: 'Smart Hint',
    description: 'AI-powered contextual hints tailored to your knowledge gaps',
    emoji: '🧠',
    icon: '🧠',
    xpCost: 200,
    category: 'assistance',
    rarity: 'epic',
    duration: 1,
    levelRequirement: 8,
    tags: ['ai', 'smart', 'personalized', 'advanced']
  },
  answer_reveal: {
    id: 'answer_reveal',
    type: 'answer_reveal',
    name: 'Answer Reveal',
    description: 'Eliminate one wrong answer in multiple choice (5 uses)',
    emoji: '🔍',
    icon: '🔍',
    xpCost: 120,
    category: 'assistance',
    rarity: 'rare',
    maxUses: 5,
    tags: ['reveal', 'multiple-choice', 'strategic']
  },
  category_insight: {
    id: 'category_insight',
    type: 'category_insight',
    name: 'Category Insight',
    description: 'See which civic category each question tests',
    emoji: '🏷️',
    icon: '🏷️',
    xpCost: 60,
    category: 'assistance',
    rarity: 'common',
    duration: 1,
    tags: ['category', 'insight', 'learning']
  },
  explanation_preview: {
    id: 'explanation_preview',
    type: 'explanation_preview',
    name: 'Explanation Preview',
    description: 'See explanation before answering (no XP penalty)',
    emoji: '📖',
    icon: '📖',
    xpCost: 100,
    category: 'assistance',
    rarity: 'uncommon',
    duration: 1,
    tags: ['explanation', 'preview', 'learning']
  },
  concept_map: {
    id: 'concept_map',
    type: 'concept_map',
    name: 'Concept Map',
    description: 'Visual connections between questions and civic concepts',
    emoji: '🗺️',
    icon: '🗺️',
    xpCost: 250,
    category: 'learning',
    rarity: 'epic',
    duration: 1,
    levelRequirement: 12,
    tags: ['visual', 'connections', 'advanced', 'learning']
  },

  // PROTECTION & SAFETY BOOSTS
  second_chance: {
    id: 'second_chance',
    type: 'second_chance',
    name: 'Second Chance',
    description: 'Get one retry on wrong answers this quiz',
    emoji: '🔄',
    icon: '🔄',
    xpCost: 200,
    category: 'protection',
    rarity: 'epic',
    duration: 1,
    tags: ['retry', 'protection', 'safety']
  },
  streak_shield: {
    id: 'streak_shield',
    type: 'streak_shield',
    name: 'Streak Shield',
    description: 'Protect your streak from one wrong answer',
    emoji: '🛡️',
    icon: '🛡️',
    xpCost: 300,
    category: 'protection',
    rarity: 'legendary',
    maxUses: 1,
    tags: ['streak', 'protection', 'valuable']
  },
  mistake_forgiveness: {
    id: 'mistake_forgiveness',
    type: 'mistake_forgiveness',
    name: 'Mistake Forgiveness',
    description: 'First wrong answer doesn\'t count against your score',
    emoji: '🤗',
    icon: '🤗',
    xpCost: 150,
    category: 'protection',
    rarity: 'rare',
    duration: 1,
    tags: ['forgiveness', 'first', 'protection']
  },
  confidence_boost: {
    id: 'confidence_boost',
    type: 'confidence_boost',
    name: 'Confidence Boost',
    description: 'Wrong answers don\'t reduce confidence score',
    emoji: '💪',
    icon: '💪',
    xpCost: 120,
    category: 'protection',
    rarity: 'uncommon',
    duration: 1,
    tags: ['confidence', 'protection', 'mental']
  },
  safety_net: {
    id: 'safety_net',
    type: 'safety_net',
    name: 'Safety Net',
    description: 'Minimum 50% score guaranteed for this quiz',
    emoji: '🥅',
    icon: '🥅',
    xpCost: 400,
    category: 'protection',
    rarity: 'mythic',
    duration: 1,
    cooldown: 48,
    levelRequirement: 20,
    tags: ['safety', 'guarantee', 'rare', 'powerful']
  },

  // STRATEGIC & ADVANCED BOOSTS
  lucky_guess: {
    id: 'lucky_guess',
    type: 'lucky_guess',
    name: 'Lucky Guess',
    description: '50% chance to get correct answer on timeout/skip',
    emoji: '🍀',
    icon: '🍀',
    xpCost: 80,
    category: 'strategic',
    rarity: 'rare',
    duration: 1,
    tags: ['luck', 'chance', 'timeout']
  },
  question_preview: {
    id: 'question_preview',
    type: 'question_preview',
    name: 'Question Preview',
    description: 'See next 3 questions before starting quiz',
    emoji: '👀',
    icon: '👀',
    xpCost: 180,
    category: 'strategic',
    rarity: 'epic',
    duration: 1,
    levelRequirement: 7,
    tags: ['preview', 'planning', 'strategic']
  },
  difficulty_scout: {
    id: 'difficulty_scout',
    type: 'difficulty_scout',
    name: 'Difficulty Scout',
    description: 'See difficulty level of each question',
    emoji: '🎚️',
    icon: '🎚️',
    xpCost: 100,
    category: 'strategic',
    rarity: 'uncommon',
    duration: 1,
    tags: ['difficulty', 'information', 'planning']
  },
  skip_token: {
    id: 'skip_token',
    type: 'skip_token',
    name: 'Skip Token',
    description: 'Skip one question without penalty (3 uses)',
    emoji: '⏭️',
    icon: '⏭️',
    xpCost: 160,
    category: 'strategic',
    rarity: 'rare',
    maxUses: 3,
    tags: ['skip', 'strategic', 'limited']
  },
  topic_mastery: {
    id: 'topic_mastery',
    type: 'topic_mastery',
    name: 'Topic Mastery',
    description: '+200% XP if you achieve 90%+ score (mastery level)',
    emoji: '🎓',
    icon: '🎓',
    xpCost: 300,
    category: 'strategic',
    rarity: 'legendary',
    duration: 1,
    levelRequirement: 15,
    tags: ['mastery', 'challenge', 'expert']
  },
  civic_scholar: {
    id: 'civic_scholar',
    type: 'civic_scholar',
    name: 'Civic Scholar',
    description: 'Unlock 3 bonus questions for extra XP and learning',
    emoji: '📚',
    icon: '📚',
    xpCost: 220,
    category: 'learning',
    rarity: 'epic',
    duration: 1,
    levelRequirement: 10,
    tags: ['bonus', 'scholar', 'extra', 'learning']
  },

  // SOCIAL & ENGAGEMENT BOOSTS
  mentor_mode: {
    id: 'mentor_mode',
    type: 'mentor_mode',
    name: 'Mentor Mode',
    description: 'Get encouraging messages and tips during quiz',
    emoji: '👨‍🏫',
    icon: '👨‍🏫',
    xpCost: 70,
    category: 'social',
    rarity: 'common',
    duration: 1,
    tags: ['mentor', 'encouragement', 'support']
  },
  achievement_hunter: {
    id: 'achievement_hunter',
    type: 'achievement_hunter',
    name: 'Achievement Hunter',
    description: '2x progress toward all achievements this quiz',
    emoji: '🏆',
    icon: '🏆',
    xpCost: 140,
    category: 'social',
    rarity: 'rare',
    duration: 1,
    tags: ['achievement', 'progress', 'hunter']
  },
  daily_streak: {
    id: 'daily_streak',
    type: 'daily_streak',
    name: 'Daily Streak',
    description: '+50% XP bonus for maintaining daily quiz streak',
    emoji: '🔥',
    icon: '🔥',
    xpCost: 90,
    category: 'social',
    rarity: 'uncommon',
    duration: 1,
    tags: ['daily', 'streak', 'habit']
  },
  weekend_warrior: {
    id: 'weekend_warrior',
    type: 'weekend_warrior',
    name: 'Weekend Warrior',
    description: '+75% XP bonus for weekend quizzing',
    emoji: '🌅',
    icon: '🌅',
    xpCost: 110,
    category: 'social',
    rarity: 'uncommon',
    duration: 1,
    tags: ['weekend', 'bonus', 'warrior']
  },
  night_owl: {
    id: 'night_owl',
    type: 'night_owl',
    name: 'Night Owl',
    description: '+60% XP bonus for late-night quizzing (after 9 PM)',
    emoji: '🦉',
    icon: '🦉',
    xpCost: 95,
    category: 'social',
    rarity: 'uncommon',
    duration: 1,
    tags: ['night', 'late', 'owl', 'bonus']
  },

  // SPECIALIZED LEARNING BOOSTS
  constitution_focus: {
    id: 'constitution_focus',
    type: 'constitution_focus',
    name: 'Constitution Focus',
    description: 'Extra hints and context for constitutional questions',
    emoji: '📜',
    icon: '📜',
    xpCost: 130,
    category: 'learning',
    rarity: 'rare',
    duration: 1,
    tags: ['constitution', 'focus', 'specialized']
  },
  current_events: {
    id: 'current_events',
    type: 'current_events',
    name: 'Current Events',
    description: 'Bonus context connecting questions to recent developments',
    emoji: '📰',
    icon: '📰',
    xpCost: 140,
    category: 'learning',
    rarity: 'rare',
    duration: 1,
    tags: ['current', 'events', 'context']
  },
  historical_context: {
    id: 'historical_context',
    type: 'historical_context',
    name: 'Historical Context',
    description: 'Additional historical background for better understanding',
    emoji: '🏛️',
    icon: '🏛️',
    xpCost: 120,
    category: 'learning',
    rarity: 'uncommon',
    duration: 1,
    tags: ['history', 'context', 'background']
  },
  local_connection: {
    id: 'local_connection',
    type: 'local_connection',
    name: 'Local Connection',
    description: 'Connect federal topics to local implications and examples',
    emoji: '🏙️',
    icon: '🏙️',
    xpCost: 110,
    category: 'learning',
    rarity: 'uncommon',
    duration: 1,
    tags: ['local', 'connection', 'practical']
  },
  debate_prep: {
    id: 'debate_prep',
    type: 'debate_prep',
    name: 'Debate Prep',
    description: 'Practice articulating positions on civic issues',
    emoji: '🗣️',
    icon: '🗣️',
    xpCost: 200,
    category: 'learning',
    rarity: 'epic',
    duration: 1,
    levelRequirement: 12,
    tags: ['debate', 'articulation', 'advanced', 'civic']
  }
}

// =============================================================================
// BOOST OPERATIONS (Enhanced)
// =============================================================================

export class BoostManager {
  private static instance: BoostManager
  private userBoosts: Map<BoostType, number> = new Map()
  private activeBoosts: Map<BoostType, ActiveBoost> = new Map()

  static getInstance(): BoostManager {
    if (!BoostManager.instance) {
      BoostManager.instance = new BoostManager()
    }
    return BoostManager.instance
  }

  // Initialize from localStorage for now
  initialize(userId: string) {
    const savedBoosts = localStorage.getItem(`user_boosts_${userId}`)
    if (savedBoosts) {
      const data = JSON.parse(savedBoosts)
      this.userBoosts = new Map(data.boosts || [])
      this.activeBoosts = new Map(data.active || [])
    }
  }

  // Save to localStorage for now
  private save(userId: string) {
    const data = {
      boosts: Array.from(this.userBoosts.entries()),
      active: Array.from(this.activeBoosts.entries())
    }
    localStorage.setItem(`user_boosts_${userId}`, JSON.stringify(data))
  }

  getAvailableBoosts(): GameBoost[] {
    return Object.values(BOOST_DEFINITIONS)
  }

  getUserBoostCount(boostType: BoostType): number {
    return this.userBoosts.get(boostType) || 0
  }

  getAllUserBoosts(): Array<{ type: BoostType; quantity: number; boost: GameBoost }> {
    return Array.from(this.userBoosts.entries())
      .filter(([_, quantity]) => quantity > 0)
      .map(([type, quantity]) => ({
        type,
        quantity,
        boost: BOOST_DEFINITIONS[type]
      }))
  }

  getActiveBoosts(): ActiveBoost[] {
    return Array.from(this.activeBoosts.values())
  }

  hasActiveBoost(boostType: BoostType): boolean {
    return this.activeBoosts.has(boostType)
  }

  canPurchaseBoost(boostType: BoostType, userXP: number): boolean {
    const boost = BOOST_DEFINITIONS[boostType]
    return userXP >= boost.xpCost
  }

  purchaseBoost(userId: string, boostType: BoostType, userXP: number): {
    success: boolean
    error?: string
    newXpBalance?: number
  } {
    const boost = BOOST_DEFINITIONS[boostType]
    
    if (userXP < boost.xpCost) {
      return { success: false, error: 'Insufficient XP' }
    }

    // Add to inventory
    const currentCount = this.userBoosts.get(boostType) || 0
    this.userBoosts.set(boostType, currentCount + 1)
    
    this.save(userId)
    
    console.log(`🛒 Boost purchased: ${boost.name} for ${boost.xpCost} XP`)
    
    return {
      success: true,
      newXpBalance: userXP - boost.xpCost
    }
  }

  activateBoost(userId: string, boostType: BoostType): {
    success: boolean
    error?: string
    activeBoost?: ActiveBoost
  } {
    const currentCount = this.userBoosts.get(boostType) || 0
    
    if (currentCount <= 0) {
      return { success: false, error: 'Boost not available' }
    }

    if (this.activeBoosts.has(boostType)) {
      return { success: false, error: 'Boost already active' }
    }

    const boost = BOOST_DEFINITIONS[boostType]
    
    // Remove from inventory
    this.userBoosts.set(boostType, currentCount - 1)
    
    // Create active boost
    const activeBoost: ActiveBoost = {
      type: boostType,
      startedAt: new Date().toISOString(),
      duration: boost.duration,
      usesRemaining: boost.maxUses
    }
    
    this.activeBoosts.set(boostType, activeBoost)
    this.save(userId)
    
    console.log(`🚀 Boost activated: ${boost.name}`)
    
    return {
      success: true,
      activeBoost
    }
  }

  useBoost(userId: string, boostType: BoostType): boolean {
    const activeBoost = this.activeBoosts.get(boostType)
    if (!activeBoost) return false

    if (activeBoost.usesRemaining && activeBoost.usesRemaining > 1) {
      // Decrease uses
      activeBoost.usesRemaining--
      this.save(userId)
      return true
    } else {
      // Remove boost
      this.activeBoosts.delete(boostType)
      this.save(userId)
      return true
    }
  }

  deactivateBoost(userId: string, boostType: BoostType): void {
    this.activeBoosts.delete(boostType)
    this.save(userId)
  }

  clearExpiredBoosts(userId: string): void {
    const now = new Date()
    const expiredBoosts: BoostType[] = []
    
    this.activeBoosts.forEach((boost, type) => {
      if (boost.duration) {
        const startTime = new Date(boost.startedAt)
        const elapsed = (now.getTime() - startTime.getTime()) / (1000 * 60 * 60) // hours
        
        if (elapsed > 24) { // 24 hour expiry for duration-based boosts
          expiredBoosts.push(type)
        }
      }
    })
    
    expiredBoosts.forEach(type => {
      this.activeBoosts.delete(type)
    })
    
    if (expiredBoosts.length > 0) {
      this.save(userId)
    }
  }
}

// =============================================================================
// BOOST EFFECTS
// =============================================================================

export interface BoostEffects {
  extraTimeSeconds: number
  xpMultiplier: number
  autoHintEnabled: boolean
  secondChanceAvailable: boolean
  streakProtected: boolean
  answerRevealAvailable: boolean
  timeFreezeAvailable: boolean
  luckyGuessChance: number
}

export function calculateBoostEffects(activeBoosts: ActiveBoost[]): BoostEffects {
  const effects: BoostEffects = {
    extraTimeSeconds: 0,
    xpMultiplier: 1,
    autoHintEnabled: false,
    secondChanceAvailable: false,
    streakProtected: false,
    answerRevealAvailable: false,
    timeFreezeAvailable: false,
    luckyGuessChance: 0
  }

  activeBoosts.forEach(boost => {
    switch (boost.type) {
      case 'extra_time':
        effects.extraTimeSeconds += 30
        break
      case 'double_xp':
        effects.xpMultiplier *= 2
        break
      case 'auto_hint':
        effects.autoHintEnabled = true
        break
      case 'second_chance':
        effects.secondChanceAvailable = true
        break
      case 'streak_shield':
        effects.streakProtected = true
        break
      case 'answer_reveal':
        effects.answerRevealAvailable = boost.usesRemaining ? boost.usesRemaining > 0 : false
        break
      case 'time_freeze':
        effects.timeFreezeAvailable = boost.usesRemaining ? boost.usesRemaining > 0 : false
        break
      case 'lucky_guess':
        effects.luckyGuessChance = 0.5
        break
    }
  })

  return effects
} 