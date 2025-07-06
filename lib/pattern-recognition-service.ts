/**
 * ============================================================================
 * CIVIC PATTERN RECOGNITION SERVICE
 * ============================================================================
 * 
 * Integrates with CivicSense's quiz engine to provide cumulative learning
 * through pattern recognition. Enables "Remember When..." callbacks and
 * tracks user progress on recognizing civic patterns.
 * 
 * Features:
 * - Pattern recognition tracking across quiz sessions
 * - Contextual callbacks to previous topics
 * - Progressive learning stages (1-5 levels)
 * - Integration with existing progress storage
 * - Guest and authenticated user support
 */

import { supabase } from '@/lib/supabase/client'
import { debug } from '@/lib/debug-config'
import type { QuizQuestion } from '@/lib/types/quiz'

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface CivicPattern {
  id: string
  pattern_name: string
  pattern_slug: string
  pattern_description: string
  pattern_type: 'power_dynamic' | 'institutional' | 'information_warfare' | 'economic' | 'electoral'
  key_indicators: string[]
  recognition_stages: PatternStage[]
  historical_examples: HistoricalExample[]
  current_relevance?: string
  difficulty_level: 1 | 2 | 3 | 4 | 5
  prerequisite_patterns: string[]
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface PatternStage {
  level: number
  description: string
  competency: string
  examples_needed: number
}

export interface HistoricalExample {
  event: string
  date: string
  description: string
  outcome: string
  relevance_score: number
}

export interface TopicPatternConnection {
  id: string
  topic_id: string
  pattern_id: string
  connection_strength: 1 | 2 | 3 | 4 | 5
  connection_type: 'demonstrates' | 'introduces' | 'reinforces' | 'contrasts'
  connection_notes: string
  is_primary_example: boolean
  introduces_pattern: boolean
  pattern: CivicPattern
}

export interface PatternCallback {
  previous_topic_id: string
  previous_topic_title: string
  previous_topic_emoji: string
  pattern_name: string
  connection_type: string
  context_description: string
  user_completed: boolean
  days_since_completion?: number
}

// ============================================================================
// PATTERN RECOGNITION LEVELS
// ============================================================================

export const RECOGNITION_LEVELS = {
  1: {
    name: 'Unaware',
    description: 'Has not encountered this pattern',
    competency: 'No recognition',
    examples_needed: 0
  },
  2: {
    name: 'Introduced',
    description: 'Has been exposed to the pattern',
    competency: 'Basic awareness',
    examples_needed: 1
  },
  3: {
    name: 'Recognizes with Help',
    description: 'Can identify pattern when guided',
    competency: 'Guided recognition',
    examples_needed: 2
  },
  4: {
    name: 'Recognizes Independently',
    description: 'Can spot pattern without assistance',
    competency: 'Independent identification',
    examples_needed: 3
  },
  5: {
    name: 'Can Teach Others',
    description: 'Mastery level - can explain and teach',
    competency: 'Teaching mastery',
    examples_needed: 5
  }
} as const

// ============================================================================
// CORE PATTERN RECOGNITION SERVICE
// ============================================================================

export class PatternRecognitionService {
  private static instance: PatternRecognitionService
  
  static getInstance(): PatternRecognitionService {
    if (!PatternRecognitionService.instance) {
      PatternRecognitionService.instance = new PatternRecognitionService()
    }
    return PatternRecognitionService.instance
  }

  /**
   * Get patterns connected to a specific topic
   */
  async getTopicPatterns(topicId: string): Promise<TopicPatternConnection[]> {
    try {
      const { data, error } = await supabase
        .from('topic_pattern_connections')
        .select('*, pattern:civic_patterns(*)')
        .eq('topic_id', topicId)
        .order('connection_strength', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      debug.error('pattern-recognition', 'Error fetching topic patterns:', error)
      return []
    }
  }

  /**
   * Generate "Remember When..." callbacks for a topic
   */
  async generatePatternCallbacks(
    topicId: string, 
    userId?: string, 
    guestToken?: string
  ): Promise<PatternCallback[]> {
    const callbacks: PatternCallback[] = []

    try {
      // Get patterns for current topic
      const topicPatterns = await this.getTopicPatterns(topicId)
      
      if (topicPatterns.length === 0) return callbacks

      // For demo purposes, return some sample callbacks
      // In full implementation, this would query related topics
      for (const topicPattern of topicPatterns) {
        callbacks.push({
          previous_topic_id: 'sample-topic',
          previous_topic_title: 'Sample Previous Topic',
          previous_topic_emoji: '🏛️',
          pattern_name: topicPattern.pattern.pattern_name,
          connection_type: topicPattern.connection_type,
          context_description: `This connects to the ${topicPattern.pattern.pattern_name} pattern you've seen before.`,
          user_completed: true,
          days_since_completion: 7
        })
      }

      return callbacks.slice(0, 3) // Limit to top 3

    } catch (error) {
      debug.error('pattern-recognition', 'Error generating pattern callbacks:', error)
      return []
    }
  }

  /**
   * Update user pattern recognition when they encounter a pattern
   */
  async updatePatternRecognition(
    patternId: string,
    recognitionType: 'exposed' | 'helped' | 'independent',
    topicId: string,
    userId?: string,
    guestToken?: string
  ): Promise<{ 
    recognition_level: number; 
    examples_seen: number; 
    level_changed: boolean 
  }> {
    if (!userId && !guestToken) {
      return { recognition_level: 1, examples_seen: 0, level_changed: false }
    }

    try {
      // Use the database function for atomic updates
      const { data, error } = await supabase.rpc('update_user_pattern_recognition', {
        p_user_id: userId || null,
        p_guest_token: guestToken || null,
        p_pattern_id: patternId,
        p_recognition_type: recognitionType,
        p_topic_id: topicId
      })

      if (error) throw error

      const result = data?.[0] || { recognition_level: 1, examples_seen: 0, level_changed: false }

      debug.log('pattern-recognition', 'Pattern recognition updated:', {
        patternId,
        recognitionType,
        result
      })

      return result
    } catch (error) {
      debug.error('pattern-recognition', 'Error updating pattern recognition:', error)
      return { recognition_level: 1, examples_seen: 0, level_changed: false }
    }
  }

  /**
   * Process question completion for pattern recognition
   */
  async processQuestionCompletion(
    question: QuizQuestion,
    isCorrect: boolean,
    timeSpent: number,
    topicId: string,
    userId?: string,
    guestToken?: string
  ): Promise<{
    patterns_reinforced: string[]
    level_ups: string[]
  }> {
    const results = {
      patterns_reinforced: [] as string[],
      level_ups: [] as string[]
    }

    try {
      // Get patterns for the current topic
      const topicPatterns = await this.getTopicPatterns(topicId)
      
      for (const topicPattern of topicPatterns) {
        // Update pattern recognition based on answer correctness
        const recognitionType = isCorrect ? 
          (timeSpent < 30 ? 'independent' : 'helped') : 
          'exposed'

        const updateResult = await this.updatePatternRecognition(
          topicPattern.pattern_id,
          recognitionType,
          topicId,
          userId,
          guestToken
        )

        results.patterns_reinforced.push(topicPattern.pattern.pattern_name)

        if (updateResult.level_changed) {
          results.level_ups.push(topicPattern.pattern.pattern_name)
        }
      }

      return results
    } catch (error) {
      debug.error('pattern-recognition', 'Error processing question completion:', error)
      return results
    }
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

export const patternRecognitionService = PatternRecognitionService.getInstance()

/**
 * Check if user has pattern recognition capability for a topic
 */
export async function hasPatternRecognitionCapability(
  topicId: string,
  userId?: string,
  guestToken?: string
): Promise<boolean> {
  try {
    const patterns = await patternRecognitionService.getTopicPatterns(topicId)
    return patterns.length > 0
  } catch (error) {
    debug.error('pattern-recognition', 'Error checking pattern capability:', error)
    return false
  }
}
