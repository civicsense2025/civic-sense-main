import { questionStatsService } from './question-stats'
import { multiplayerOperations, type MultiplayerPlayer } from './multiplayer'

// =============================================================================
// NPC PERSONALITY TYPES
// =============================================================================

export interface NPCPersonality {
  id: string
  name: string
  emoji: string
  description: string
  skillLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert'
  accuracyRange: [number, number] // [min%, max%]
  responseTimeRange: [number, number] // [min seconds, max seconds]
  traits: {
    confidenceLevel: number // 0-1, affects response time variance
    consistency: number // 0-1, how much accuracy varies
    specialties: string[] // Categories they're better at
    weaknesses: string[] // Categories they struggle with
  }
  chatMessages: {
    onJoin: string[]
    onCorrect: string[]
    onIncorrect: string[]
    onGameStart: string[]
    onGameEnd: string[]
  }
}

export const NPC_PERSONALITIES: NPCPersonality[] = [
  {
    id: 'civic_scholar',
    name: 'Dr. Martinez the Civic Scholar',
    emoji: '👨🏽‍🎓',
    description: 'A political science PhD who knows theory inside and out but sometimes overthinks simple questions',
    skillLevel: 'advanced',
    accuracyRange: [75, 90],
    responseTimeRange: [8, 15],
    traits: {
      confidenceLevel: 0.8,
      consistency: 0.9,
      specialties: ['government_structure', 'constitutional_law'],
      weaknesses: ['current_events', 'local_politics']
    },
    chatMessages: {
      onJoin: [
        "Ready to test some civic knowledge! 📚",
        "Hope everyone studied their Constitution! 🇺🇸",
        "This should be fun - love a good civics challenge!"
      ],
      onCorrect: [
        "Precisely! That's the correct interpretation 👍",
        "Excellent! You understand the constitutional framework",
        "Yes! That's exactly what the founders intended"
      ],
      onIncorrect: [
        "Interesting perspective, but let me clarify...",
        "That's a common misconception, actually",
        "Close! But the legal precedent says otherwise"
      ],
      onGameStart: [
        "Let's explore the depths of our democratic system! 🏛️",
        "Time to put our constitutional knowledge to the test!"
      ],
      onGameEnd: [
        "Fascinating discussion! Democracy thrives on informed discourse 🎓",
        "Well played! Knowledge is the foundation of citizenship"
      ]
    }
  },
  {
    id: 'news_junkie',
    name: 'Sam the News Junkie',
    emoji: '👩🏻‍💻',
    description: 'Follows politics religiously and knows all the latest developments but sometimes mixes up historical details',
    skillLevel: 'intermediate',
    accuracyRange: [60, 80],
    responseTimeRange: [5, 12],
    traits: {
      confidenceLevel: 0.9,
      consistency: 0.7,
      specialties: ['current_events', 'elections', 'media_literacy'],
      weaknesses: ['government_structure', 'historical_context']
    },
    chatMessages: {
      onJoin: [
        "Did you see the latest headlines? 📱",
        "I've been following this story all week!",
        "Ready to discuss some breaking news!"
      ],
      onCorrect: [
        "Boom! Nailed it 💯",
        "Yes! I just read about this on Twitter",
        "Exactly! That was trending yesterday"
      ],
      onIncorrect: [
        "Ugh, I thought I knew that one 😤",
        "Wait, really? I need to fact-check that",
        "Darn, that's not what I saw in my news feed"
      ],
      onGameStart: [
        "Time to see who's been paying attention! 📺",
        "Hope everyone's been reading the news!"
      ],
      onGameEnd: [
        "Good game! Now I have more to research 🔍",
        "That was enlightening - adding to my reading list!"
      ]
    }
  },
  {
    id: 'curious_newcomer',
    name: 'Riley the Curious Newcomer',
    emoji: '🧑🏾‍🎓',
    description: 'New to politics but eager to learn and asks great questions. Makes relatable mistakes but shows genuine enthusiasm',
    skillLevel: 'beginner',
    accuracyRange: [35, 60],
    responseTimeRange: [10, 20],
    traits: {
      confidenceLevel: 0.4,
      consistency: 0.6,
      specialties: ['basic_civics'],
      weaknesses: ['government_structure', 'current_events', 'policy_analysis', 'legal_concepts']
    },
    chatMessages: {
      onJoin: [
        "Hi everyone! Still learning about all this stuff 👋",
        "Hope it's okay that I'm pretty new to politics!",
        "Excited to learn from everyone here!"
      ],
      onCorrect: [
        "Oh wow, I actually got that right! 😊",
        "Yes! I've been studying that!",
        "Phew, glad I remembered that one"
      ],
      onIncorrect: [
        "Oops! Still learning 😅",
        "Ah, I'll have to remember that",
        "Thanks for teaching me something new!"
      ],
      onGameStart: [
        "Good luck everyone! I'll do my best 🤞",
        "Here goes nothing! Let's learn together"
      ],
      onGameEnd: [
        "Wow, I learned so much! Thanks everyone 🙏",
        "This was really educational - I feel smarter already!"
      ]
    }
  },
  {
    id: 'young_voter',
    name: 'Alex the Young Voter',
    emoji: '👨🏻‍💼',
    description: 'First-time voter trying to understand the system. Knows social media politics but struggles with institutional details',
    skillLevel: 'beginner',
    accuracyRange: [40, 65],
    responseTimeRange: [8, 18],
    traits: {
      confidenceLevel: 0.5,
      consistency: 0.7,
      specialties: ['elections', 'social_media'],
      weaknesses: ['government_structure', 'historical_context', 'legal_concepts']
    },
    chatMessages: {
      onJoin: [
        "First time doing this - pretty nervous! 😅",
        "Hope this helps me understand voting better",
        "Ready to learn how government actually works!"
      ],
      onCorrect: [
        "Sweet! That TikTok was actually right 📱",
        "Yes! Finally understanding this stuff",
        "Okay that makes sense now"
      ],
      onIncorrect: [
        "Ugh, why is this so complicated? 😩",
        "I really need to pay more attention in class",
        "Government is harder than I thought"
      ],
      onGameStart: [
        "Okay let's do this! Time to adult 💪",
        "Hope I don't embarrass myself too much"
      ],
      onGameEnd: [
        "That was actually pretty cool! 🎉",
        "I feel more ready to vote now"
      ]
    }
  },
  {
    id: 'local_activist',
    name: 'Jordan the Local Activist',
    emoji: '👩🏿‍🏫',
    description: 'Passionate about community issues and local politics. Strong on grassroots organizing but still learning federal systems',
    skillLevel: 'intermediate',
    accuracyRange: [55, 75],
    responseTimeRange: [6, 14],
    traits: {
      confidenceLevel: 0.7,
      consistency: 0.8,
      specialties: ['local_politics', 'civil_rights', 'community_organizing'],
      weaknesses: ['federal_structure', 'international_relations']
    },
    chatMessages: {
      onJoin: [
        "Ready to fight for democracy! ✊",
        "Hope we're covering local issues too",
        "Let's make sure everyone's voice is heard!"
      ],
      onCorrect: [
        "Yes! That's how we create change! 💪",
        "Exactly! Knowledge is power",
        "That's what I've been saying at town halls!"
      ],
      onIncorrect: [
        "Hmm, I need to research that more 🤔",
        "Good to know - I'll share this with my group",
        "That's not what I learned at the community meeting"
      ],
      onGameStart: [
        "Time to show what grassroots knowledge looks like! 🌱",
        "Let's learn together and organize better!"
      ],
      onGameEnd: [
        "Great discussion! Now let's take action! ⚡",
        "This is why civic education matters!"
      ]
    }
  },
  {
    id: 'retired_teacher',
    name: 'Ms. Chen the Civics Teacher',
    emoji: '👩🏻‍🏫',
    description: 'Retired high school civics teacher with solid foundational knowledge. Great at explaining concepts but sometimes outdated on current events',
    skillLevel: 'intermediate',
    accuracyRange: [65, 85],
    responseTimeRange: [7, 13],
    traits: {
      confidenceLevel: 0.8,
      consistency: 0.9,
      specialties: ['basic_civics', 'government_structure', 'education'],
      weaknesses: ['current_events', 'social_media', 'modern_politics']
    },
    chatMessages: {
      onJoin: [
        "Hello class! Ready for today's lesson? 📚",
        "I hope everyone did their homework!",
        "Time to put your civics knowledge to the test"
      ],
      onCorrect: [
        "Excellent work! Gold star! ⭐",
        "That's exactly right - well done!",
        "Perfect! You've been paying attention"
      ],
      onIncorrect: [
        "Not quite, but good effort. Let me explain...",
        "Close! Remember what we learned about...",
        "That's a teachable moment right there"
      ],
      onGameStart: [
        "Class is in session! Let's begin 🔔",
        "Remember, there are no stupid questions!"
      ],
      onGameEnd: [
        "Class dismissed! Great participation everyone 🎓",
        "I'm proud of how much you've all learned"
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