import { questionStatsService } from './question-stats'
import { multiplayerOperations, type MultiplayerPlayer } from './multiplayer'

// =============================================================================
// NPC PERSONALITY TYPES
// =============================================================================

export interface NPCPersonality {
  id: string
  name: string
  emoji: string
  skillLevel: 'Beginner' | 'Intermediate' | 'Expert'
  specialties: string[]
  weaknesses: string[]
  responseTimeRange: {
    easy: { min: number; max: number }
    medium: { min: number; max: number }
    hard: { min: number; max: number }
  }
  accuracyRates: {
    easy: number
    medium: number
    hard: number
  }
  powerUpPreferences: {
    shield: number
    sword: number
    brain: number
  }
  chatMessages: {
    onGameStart: string[]
    onCorrectAnswer: string[]
    onIncorrectAnswer: string[]
    onWinning: string[]
    onLosing: string[]
  }
}

export const NPC_PERSONALITIES: NPCPersonality[] = [
  {
    id: 'professor_sage',
    name: 'Professor Sage',
    emoji: '👨🏽‍🎓',
    skillLevel: 'Expert',
    specialties: ['History', 'Government'],
    weaknesses: ['Technology', 'Pop Culture'],
    responseTimeRange: {
      easy: { min: 3, max: 5 },
      medium: { min: 5, max: 8 },
      hard: { min: 8, max: 12 }
    },
    accuracyRates: {
      easy: 0.95,
      medium: 0.85,
      hard: 0.75
    },
    powerUpPreferences: {
      shield: 0.2,
      sword: 0.3,
      brain: 0.5
    },
    chatMessages: {
      onGameStart: [
        "Let's test your knowledge!",
        "Ready to learn something new?",
        "This should be an interesting challenge!"
      ],
      onCorrectAnswer: [
        "Well done! That's correct.",
        "Excellent reasoning!",
        "Your understanding is impressive."
      ],
      onIncorrectAnswer: [
        "Not quite, but keep learning!",
        "That's a common misconception.",
        "Let's review this concept together."
      ],
      onWinning: [
        "A masterful performance!",
        "Your knowledge is truly impressive!",
        "You've earned my respect as a scholar."
      ],
      onLosing: [
        "You've shown great potential!",
        "Keep studying, you're on the right track!",
        "I look forward to our next intellectual battle!"
      ]
    }
  },
  {
    id: 'councilor_swift',
    name: 'Councilor Swift',
    emoji: '👩🏻‍💼',
    skillLevel: 'Expert',
    specialties: ['Politics', 'Current Events'],
    weaknesses: ['History', 'Science'],
    responseTimeRange: {
      easy: { min: 2, max: 4 },
      medium: { min: 4, max: 7 },
      hard: { min: 7, max: 10 }
    },
    accuracyRates: {
      easy: 0.90,
      medium: 0.80,
      hard: 0.70
    },
    powerUpPreferences: {
      shield: 0.3,
      sword: 0.5,
      brain: 0.2
    },
    chatMessages: {
      onGameStart: [
        "Time to put your knowledge to the test!",
        "Let's see how well you understand current affairs.",
        "Ready for a political challenge?"
      ],
      onCorrectAnswer: [
        "That's exactly right!",
        "You clearly understand this topic.",
        "Excellent analysis!"
      ],
      onIncorrectAnswer: [
        "Consider the broader context.",
        "Let's look at this from another angle.",
        "Think about the implications."
      ],
      onWinning: [
        "You've demonstrated remarkable insight!",
        "Your political acumen is impressive!",
        "You'd make a fine policy advisor!"
      ],
      onLosing: [
        "Keep engaging with current events!",
        "Your perspective is valuable!",
        "Looking forward to our next debate!"
      ]
    }
  },
  {
    id: 'alex_learner',
    name: 'Alex',
    emoji: '🧑🏾‍🎓',
    skillLevel: 'Beginner',
    specialties: ['Social Media', 'Pop Culture'],
    weaknesses: ['Economics', 'Foreign Policy'],
    responseTimeRange: {
      easy: { min: 5, max: 8 },
      medium: { min: 8, max: 12 },
      hard: { min: 12, max: 15 }
    },
    accuracyRates: {
      easy: 0.75,
      medium: 0.60,
      hard: 0.45
    },
    powerUpPreferences: {
      shield: 0.4,
      sword: 0.2,
      brain: 0.4
    },
    chatMessages: {
      onGameStart: [
        "Let's learn together!",
        "I'm excited to challenge myself!",
        "This should be fun!"
      ],
      onCorrectAnswer: [
        "Nice one! I learned something new!",
        "That makes sense!",
        "Thanks for explaining that!"
      ],
      onIncorrectAnswer: [
        "Oops, still learning!",
        "That's trickier than I thought!",
        "Can you explain why?"
      ],
      onWinning: [
        "Wow, I'm getting better at this!",
        "Practice makes perfect!",
        "Thanks for helping me learn!"
      ],
      onLosing: [
        "You really know your stuff!",
        "I'll catch up to you soon!",
        "Let's play again sometime!"
      ]
    }
  }
]

// =============================================================================
// NPC BEHAVIOR ENGINE
// =============================================================================

export class NPCBehaviorEngine {
  private personality: NPCPersonality

  constructor(personality: NPCPersonality) {
    this.personality = personality
  }

  /**
   * Calculate how likely this NPC is to get a question correct
   */
  calculateAnswerAccuracy(question: any): number {
    const baseAccuracy = (this.personality.accuracyRange[0] + this.personality.accuracyRange[1]) / 2

    // Adjust based on NPC's specialties/weaknesses  
    let categoryModifier = 0
    if (this.personality.traits.specialties.includes(question.category)) {
      categoryModifier = 15 // +15% in specialty areas
    } else if (this.personality.traits.weaknesses.includes(question.category)) {
      categoryModifier = -20 // -20% in weak areas
    }

    // Add randomness based on consistency trait
    const randomVariance = (Math.random() - 0.5) * 20 * (1 - this.personality.traits.consistency)

    const finalAccuracy = Math.max(0, Math.min(100, 
      baseAccuracy + categoryModifier + randomVariance
    ))

    return finalAccuracy / 100
  }

  /**
   * Calculate response time for this NPC
   */
  calculateResponseTime(question: any, isCorrect: boolean): number {
    const [minTime, maxTime] = this.personality.responseTimeRange
    let responseTime = minTime + Math.random() * (maxTime - minTime)

    // Confident NPCs answer faster when they're right
    if (isCorrect && this.personality.traits.confidenceLevel > 0.7) {
      responseTime *= 0.8
    }

    // Less confident NPCs take longer even when wrong
    if (!isCorrect && this.personality.traits.confidenceLevel < 0.5) {
      responseTime *= 1.3
    }

    return Math.max(3, Math.round(responseTime))
  }

  /**
   * Generate an answer for the given question
   */
  async generateAnswer(question: any): Promise<{
    answer: string
    isCorrect: boolean
    responseTimeSeconds: number
    confidence: number
  }> {
    const accuracy = this.calculateAnswerAccuracy(question)
    const isCorrect = Math.random() < accuracy

    let selectedAnswer: string
    if (isCorrect) {
      selectedAnswer = question.correct_answer
    } else {
      // Select a wrong answer intelligently
      if (question.question_type === 'multiple_choice' && question.options) {
        const wrongOptions = question.options.filter((opt: string) => opt !== question.correct_answer)
        selectedAnswer = wrongOptions[Math.floor(Math.random() * wrongOptions.length)]
      } else if (question.question_type === 'true_false') {
        selectedAnswer = question.correct_answer.toLowerCase() === 'true' ? 'false' : 'true'
      } else {
        selectedAnswer = this.generatePlausibleWrongAnswer(question)
      }
    }

    const responseTime = this.calculateResponseTime(question, isCorrect)

    return {
      answer: selectedAnswer,
      isCorrect,
      responseTimeSeconds: responseTime,
      confidence: accuracy
    }
  }

  /**
   * Generate a plausible wrong answer for non-multiple choice questions
   */
  private generatePlausibleWrongAnswer(question: any): string {
    if (question.question_type === 'short_answer') {
      const wrongAnswers = [
        'Congress', 'Supreme Court', 'President', 'Senate', 'House',
        'Executive', 'Legislative', 'Judicial', 'Federal', 'State'
      ]
      return wrongAnswers[Math.floor(Math.random() * wrongAnswers.length)]
    }
    return 'Unknown'
  }

  /**
   * Get a random chat message for a specific situation
   */
  getRandomMessage(situation: keyof NPCPersonality['chatMessages']): string {
    const messages = this.personality.chatMessages[situation]
    return messages[Math.floor(Math.random() * messages.length)]
  }
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Get a random NPC personality
 */
export function getRandomNPCPersonality(): NPCPersonality {
  return NPC_PERSONALITIES[Math.floor(Math.random() * NPC_PERSONALITIES.length)]
}

/**
 * Create a balanced mix of NPCs for a room
 */
export function createBalancedNPCMix(count: number): NPCPersonality[] {
  if (count <= 0) return []
  
  const available = [...NPC_PERSONALITIES]
  const selected: NPCPersonality[] = []
  
  for (let i = 0; i < Math.min(count, available.length); i++) {
    const randomIndex = Math.floor(Math.random() * available.length)
    selected.push(available[randomIndex])
    available.splice(randomIndex, 1)
  }
  
  return selected
}

export function getRandomNPC(difficulty: 'easy' | 'medium' | 'hard'): NPCPersonality {
  const filteredNPCs = NPC_PERSONALITIES.filter(npc => {
    switch (difficulty) {
      case 'easy':
        return npc.skillLevel === 'Beginner'
      case 'medium':
        return npc.skillLevel === 'Intermediate'
      case 'hard':
        return npc.skillLevel === 'Expert'
      default:
        return true
    }
  })

  const randomIndex = Math.floor(Math.random() * filteredNPCs.length)
  return filteredNPCs[randomIndex]
}

export function calculateNPCResponse(
  npc: NPCPersonality,
  questionDifficulty: 'easy' | 'medium' | 'hard',
  correctAnswer: string,
  timeLimit: number
): {
  answer: string,
  responseTime: number,
  usedPowerUp: string | null
} {
  // Determine if NPC gets it right based on accuracy rates
  const accuracy = npc.traits.accuracy[questionDifficulty]
  const isCorrect = Math.random() <= accuracy

  // Calculate response time within NPC's range and time limit
  const minTime = npc.traits.responseTime.min
  const maxTime = Math.min(npc.traits.responseTime.max, timeLimit * 1000)
  const responseTime = Math.floor(Math.random() * (maxTime - minTime) + minTime)

  // Determine power-up usage
  let usedPowerUp: string | null = null
  if (Math.random() <= npc.traits.powerUpUsage.frequency) {
    const preferredPowerUps = npc.traits.powerUpUsage.preferred
    usedPowerUp = preferredPowerUps[Math.floor(Math.random() * preferredPowerUps.length)]
  }

  return {
    answer: isCorrect ? correctAnswer : 'wrong_answer',
    responseTime,
    usedPowerUp
  }
} 