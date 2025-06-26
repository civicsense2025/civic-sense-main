/**
 * CivicSense Personality Manager
 * 
 * Manages the diverse cast of civic personalities and intelligently routes
 * conversations to the most appropriate expert based on topic and user needs.
 * 
 * Features:
 * - 20 unique civic personalities with real backgrounds
 * - Intelligent personality matching for topics
 * - Tool-specific personality assignment
 * - Dynamic personality switching in conversations
 * - Real expertise-based responses
 */

import { createClient } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'

// =============================================================================
// PERSONALITY TYPES & INTERFACES
// =============================================================================

export interface CivicPersonality {
  id: string
  npc_code: string
  display_name: string
  first_name: string
  last_name: string
  emoji: string
  description: string
  personality_type: string
  byline: string
  background_story: string
  
  // Skills & Accuracy
  base_skill_level: 'beginner' | 'intermediate' | 'advanced' | 'expert'
  base_accuracy_min: number
  base_accuracy_max: number
  confidence_level: number
  
  // Communication Style
  response_time_min: number
  response_time_max: number
  chattiness_level: number
  encouragement_style: 'supportive' | 'formal' | 'competitive' | 'analytical' | 'casual'
  humor_level: number
  communication_style: string
  
  // Expertise & Background
  age_range: string
  location: string
  profession: string
  political_engagement_level: 'low' | 'moderate' | 'high'
  preferred_topics: string[]
  learning_motivation: string
  
  // Learning Characteristics
  learning_enabled: boolean
  adaptation_rate: number
  consistency_factor: number
  max_skill_drift: number
  
  // Status
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface PersonalityMatch {
  personality: CivicPersonality
  relevanceScore: number
  matchReasons: string[]
  expertiseAreas: string[]
}

export interface ConversationPersonalityContext {
  primaryPersonality: CivicPersonality
  consultingPersonalities: CivicPersonality[]
  topicExpertise: Record<string, CivicPersonality>
  conversationStyle: 'single' | 'collaborative' | 'debate' | 'teaching'
}

// =============================================================================
// PERSONALITY MANAGER CLASS
// =============================================================================

export class PersonalityManager {
  private supabase: SupabaseClient
  private personalities: Map<string, CivicPersonality> = new Map()
  private topicMappings: Map<string, string[]> = new Map()
  private toolPersonalities: Map<string, CivicPersonality> = new Map()
  private loaded: boolean = false

  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    this.initializeTopicMappings()
  }

  // =============================================================================
  // INITIALIZATION & DATA LOADING
  // =============================================================================

  /**
   * Load all personalities from the database
   */
  async loadPersonalities(): Promise<void> {
    if (this.loaded) return

    try {
      const { data: personalities, error } = await this.supabase
        .from('npc_personalities')
        .select('*')
        .eq('is_active', true)

      if (error) {
        console.error('Error loading personalities:', error)
        return
      }

      // Store personalities in map for quick access
      for (const personality of personalities || []) {
        this.personalities.set(personality.npc_code, {
          ...personality,
          preferred_topics: Array.isArray(personality.preferred_topics) 
            ? personality.preferred_topics 
            : []
        })
      }

      // Assign default personalities to AI tools
      await this.assignToolPersonalities()
      
      this.loaded = true
      console.log(`Loaded ${this.personalities.size} civic personalities`)

    } catch (error) {
      console.error('Failed to load personalities:', error)
    }
  }

  /**
   * Initialize topic-to-personality mappings
   */
  private initializeTopicMappings(): void {
    this.topicMappings = new Map([
      // Constitutional & Legal
      ['constitutional_law', ['michael_lawyer', 'helen_judge', 'george_historian']],
      ['civil_rights', ['michael_lawyer', 'betty_activist', 'helen_judge']],
      ['supreme_court', ['helen_judge', 'michael_lawyer', 'thomas_professor']],
      ['judicial_process', ['helen_judge', 'michael_lawyer', 'rachel_staffer']],
      
      // Economic & Fiscal Policy  
      ['fiscal_policy', ['maria_economist', 'thomas_professor', 'robert_mayor']],
      ['economic_policy', ['maria_economist', 'marcus_union', 'emma_nonprofit']],
      ['monetary_policy', ['maria_economist', 'thomas_professor']],
      ['labor_rights', ['marcus_union', 'betty_activist', 'carlos_activist']],
      
      // Local & Community
      ['local_government', ['robert_mayor', 'sarah_parent', 'anna_journalist']],
      ['municipal_finance', ['robert_mayor', 'maria_economist']],
      ['education_policy', ['lisa_teacher', 'sarah_parent', 'thomas_professor']],
      ['community_organizing', ['carlos_activist', 'marcus_union', 'betty_activist']],
      
      // Federal & Congressional
      ['congressional_process', ['rachel_staffer', 'diane_lobbyist', 'anna_journalist']],
      ['legislative_drafting', ['rachel_staffer', 'michael_lawyer', 'diane_lobbyist']],
      ['lobbying_ethics', ['diane_lobbyist', 'anna_journalist', 'thomas_professor']],
      
      // International & Defense
      ['foreign_policy', ['william_diplomat', 'james_veteran', 'thomas_professor']],
      ['national_security', ['james_veteran', 'william_diplomat', 'helen_judge']],
      ['international_relations', ['william_diplomat', 'thomas_professor']],
      
      // Social Issues & Activism
      ['social_justice', ['carlos_activist', 'betty_activist', 'michael_lawyer']],
      ['voting_rights', ['betty_activist', 'david_newcomer', 'thomas_professor']],
      ['immigration_policy', ['david_newcomer', 'carlos_activist', 'michael_lawyer']],
      ['healthcare_policy', ['emma_nonprofit', 'sarah_parent', 'maria_economist']],
      
      // Technology & Modern Issues
      ['tech_policy', ['tyler_gamer', 'anna_journalist', 'thomas_professor']],
      ['digital_rights', ['tyler_gamer', 'michael_lawyer', 'carlos_activist']],
      ['free_speech', ['tyler_gamer', 'michael_lawyer', 'anna_journalist']],
      
      // Veterans & Military
      ['veterans_affairs', ['james_veteran', 'emma_nonprofit', 'robert_mayor']],
      ['civic_duty', ['james_veteran', 'betty_activist', 'lisa_teacher']],
      
      // Education & Youth
      ['civic_education', ['lisa_teacher', 'maya_college', 'thomas_professor']],
      ['youth_engagement', ['lisa_teacher', 'maya_college', 'tyler_gamer']],
      ['student_rights', ['maya_college', 'michael_lawyer', 'lisa_teacher']],
      
      // Environmental
      ['environmental_policy', ['diane_lobbyist', 'emma_nonprofit', 'carlos_activist']],
      
      // General Civic Engagement
      ['voting_basics', ['maya_college', 'david_newcomer', 'lisa_teacher']],
      ['government_transparency', ['anna_journalist', 'carlos_activist', 'thomas_professor']],
      ['political_participation', ['betty_activist', 'carlos_activist', 'sarah_parent']]
    ])
  }

  /**
   * Assign default personalities to AI tools based on expertise
   */
  private async assignToolPersonalities(): Promise<void> {
    const toolAssignments = {
      'civic_action_generator': 'carlos_activist', // Community organizer for action
      'power_dynamics_analyzer': 'anna_journalist', // Investigative journalist
      'bias_analyzer': 'anna_journalist', // Media literacy expert
      'bill_analyzer': 'rachel_staffer', // Congressional staffer
      'user_behavior_analyzer': 'thomas_professor', // Academic researcher
      'collection_organizer': 'lisa_teacher', // Educator for content organization
      'takeaways_generator': 'thomas_professor', // Academic for synthesis
      'theme_detector': 'thomas_professor' // Academic for categorization
    }

    for (const [tool, personalityCode] of Object.entries(toolAssignments)) {
      const personality = this.personalities.get(personalityCode)
      if (personality) {
        this.toolPersonalities.set(tool, personality)
      }
    }
  }

  // =============================================================================
  // PERSONALITY MATCHING & SELECTION
  // =============================================================================

  /**
   * Find the best personality match for a given topic or query
   */
  async findBestPersonalityMatch(
    topic: string,
    userQuery?: string,
    userExperienceLevel: 'beginner' | 'intermediate' | 'advanced' = 'intermediate'
  ): Promise<PersonalityMatch | null> {
    await this.loadPersonalities()

    const candidates: PersonalityMatch[] = []
    const lowerTopic = topic.toLowerCase()
    const lowerQuery = userQuery?.toLowerCase() || ''

    // Score personalities based on topic relevance
    for (const [code, personality] of this.personalities.entries()) {
      let relevanceScore = 0
      const matchReasons: string[] = []
      const expertiseAreas: string[] = []

      // Check direct topic matches
      for (const [topicKey, personalityCodes] of this.topicMappings.entries()) {
        if (lowerTopic.includes(topicKey) || lowerQuery.includes(topicKey)) {
          if (personalityCodes.includes(code)) {
            relevanceScore += 30
            matchReasons.push(`Expert in ${topicKey}`)
            expertiseAreas.push(topicKey)
          }
        }
      }

      // Check preferred topics
      for (const prefTopic of personality.preferred_topics) {
        if (lowerTopic.includes(prefTopic) || lowerQuery.includes(prefTopic)) {
          relevanceScore += 20
          matchReasons.push(`Specializes in ${prefTopic}`)
          expertiseAreas.push(prefTopic)
        }
      }

      // Check profession relevance
      const professionKeywords = personality.profession.toLowerCase().split(' ')
      for (const keyword of professionKeywords) {
        if (lowerTopic.includes(keyword) || lowerQuery.includes(keyword)) {
          relevanceScore += 15
          matchReasons.push(`Professional background in ${keyword}`)
        }
      }

      // Skill level matching bonus
      if (this.skillLevelMatches(personality.base_skill_level, userExperienceLevel)) {
        relevanceScore += 10
        matchReasons.push('Appropriate expertise level for user')
      }

      // Background story relevance
      if (personality.background_story.toLowerCase().includes(lowerTopic)) {
        relevanceScore += 10
        matchReasons.push('Relevant personal experience')
      }

      if (relevanceScore > 0) {
        candidates.push({
          personality,
          relevanceScore,
          matchReasons,
          expertiseAreas
        })
      }
    }

    // Sort by relevance score and return best match
    candidates.sort((a, b) => b.relevanceScore - a.relevanceScore)
    return candidates.length > 0 ? candidates[0] : null
  }

  /**
   * Get multiple expert perspectives for complex topics
   */
  async getExpertPanel(
    topic: string,
    maxExperts: number = 3
  ): Promise<PersonalityMatch[]> {
    await this.loadPersonalities()

    const allMatches: PersonalityMatch[] = []
    const lowerTopic = topic.toLowerCase()

    // Find all relevant personalities
    for (const [code, personality] of this.personalities.entries()) {
      let relevanceScore = 0
      const matchReasons: string[] = []
      const expertiseAreas: string[] = []

      // Check topic mappings
      for (const [topicKey, personalityCodes] of this.topicMappings.entries()) {
        if (lowerTopic.includes(topicKey)) {
          if (personalityCodes.includes(code)) {
            relevanceScore += 25
            matchReasons.push(`${topicKey} expert`)
            expertiseAreas.push(topicKey)
          }
        }
      }

      if (relevanceScore > 0) {
        allMatches.push({
          personality,
          relevanceScore,
          matchReasons,
          expertiseAreas
        })
      }
    }

    // Return top matches with diverse perspectives
    allMatches.sort((a, b) => b.relevanceScore - a.relevanceScore)
    return this.selectDiverseExperts(allMatches, maxExperts)
  }

  /**
   * Select diverse experts to avoid echo chambers
   */
  private selectDiverseExperts(
    matches: PersonalityMatch[], 
    maxExperts: number
  ): PersonalityMatch[] {
    const selected: PersonalityMatch[] = []
    const usedProfessions = new Set<string>()
    const usedPersonalityTypes = new Set<string>()

    for (const match of matches) {
      if (selected.length >= maxExperts) break

      const profession = match.personality.profession
      const personalityType = match.personality.personality_type

      // Prioritize diversity in professional backgrounds and personality types
      if (selected.length === 0 || 
          (!usedProfessions.has(profession) && !usedPersonalityTypes.has(personalityType))) {
        selected.push(match)
        usedProfessions.add(profession)
        usedPersonalityTypes.add(personalityType)
      } else if (selected.length < maxExperts && match.relevanceScore > 40) {
        // Include very high-scoring matches even if not diverse
        selected.push(match)
      }
    }

    return selected
  }

  // =============================================================================
  // PERSONALITY-DRIVEN RESPONSE GENERATION
  // =============================================================================

  /**
   * Generate a response in a specific personality's voice
   */
  generatePersonalityResponse(
    personality: CivicPersonality,
    userQuery: string,
    factualContent: string,
    context?: any
  ): {
    response: string
    personality_traits: string[]
    expertise_highlighted: string[]
  } {
    const traits: string[] = []
    const expertise: string[] = []

    // Build response based on personality characteristics
    let response = this.getPersonalityGreeting(personality)

    // Add personality-specific perspective
    response += this.addPersonalityPerspective(personality, userQuery, factualContent)

    // Add communication style elements
    response += this.addCommunicationStyle(personality, factualContent)

    // Add closing in character
    response += this.getPersonalityClosing(personality)

    return {
      response,
      personality_traits: this.getPersonalityTraits(personality),
      expertise_highlighted: personality.preferred_topics
    }
  }

  private getPersonalityGreeting(personality: CivicPersonality): string {
    const greetings: Record<string, string> = {
      'maya_college': `Hey! Maya here 👩🏻‍🎓 - I'm still learning this stuff too, but let me share what I've figured out...`,
      'james_veteran': `This is James Thompson 👨🏿‍✈️. As a veteran, I take civic duty seriously. Here's what you need to know:`,
      'michael_lawyer': `Michael Chang here 👨🏻‍⚖️. From a constitutional law perspective:`,
      'helen_judge': `Judge Rodriguez speaking 👩🏽‍⚖️. In my 25 years on the federal bench, I've seen how this works:`,
      'anna_journalist': `Anna Foster, investigative journalist 👩🏼‍💼. I've been digging into this story, and here's what I found:`,
      'carlos_activist': `Carlos Mendez here 👨🏽‍🎨. As a community organizer, I'll tell you what they don't want you to know:`,
      'betty_activist': `This is Betty Johnson 👩🏿‍🦳. I've been fighting for justice for 60 years, and let me tell you:`,
      'maria_economist': `Maria Gonzalez, former Fed economist 👩🏽‍💼. Looking at the economic data:`,
      'robert_mayor': `Mayor Kim here 👨🏻‍💼. From running a city, I can tell you how this actually works:`,
      'rachel_staffer': `Rachel Adams, congressional staffer 👩🏼‍💻. I write these bills, so here's the inside story:`
    }

    return greetings[personality.npc_code] || `${personality.first_name} here ${personality.emoji}. `
  }

  private addPersonalityPerspective(
    personality: CivicPersonality,
    userQuery: string,
    factualContent: string
  ): string {
    // Add personality-specific insights based on their background
    const perspectives: Record<string, string> = {
      'lawyer': 'From a legal standpoint, ',
      'judge': 'Constitutionally speaking, ',
      'journalist': 'My investigation reveals that ',
      'activist': 'The grassroots reality is that ',
      'economist': 'The economic impact shows that ',
      'veteran': 'From my military service, I learned that ',
      'teacher': 'To help you understand this, ',
      'mayor': 'Running a city taught me that ',
      'staffer': 'Behind the scenes in Congress, '
    }

    const personalityType = personality.personality_type
    const prefix = perspectives[personalityType] || 'Based on my experience, '

    return `\n\n${prefix}${factualContent}\n`
  }

  private addCommunicationStyle(
    personality: CivicPersonality,
    content: string
  ): string {
    const style = personality.communication_style

    switch (style) {
      case 'casual':
        return '\n\nLook, the bottom line is this stuff matters for your daily life. '
      case 'formal':
        return '\n\nIt is essential that citizens understand these implications. '
      case 'activist':
        return '\n\nThis is exactly why we need to organize and fight back. '
      case 'academic':
        return '\n\nThe research clearly demonstrates the importance of this issue. '
      case 'investigative':
        return '\n\nHere\'s what my sources are telling me about what happens next: '
      case 'storytelling':
        return '\n\nLet me tell you what I\'ve seen in my decades of activism: '
      default:
        return '\n\n'
    }
  }

  private getPersonalityClosing(personality: CivicPersonality): string {
    const closings: Record<string, string> = {
      'maya_college': 'Hope this helps! We\'re all learning together 📚',
      'james_veteran': 'Stay vigilant and stay engaged. That\'s our duty as citizens.',
      'michael_lawyer': 'Remember: these rights only exist if we defend them.',
      'helen_judge': 'The Constitution is only as strong as our commitment to uphold it.',
      'anna_journalist': 'Keep asking questions. Democracy depends on it.',
      'carlos_activist': 'Now let\'s turn this knowledge into action! ✊',
      'betty_activist': 'The fight continues. Each generation must do their part.',
      'maria_economist': 'Watch the numbers. They tell the real story.',
      'robert_mayor': 'Local action creates real change. Get involved in your community.',
      'rachel_staffer': 'Want real change? Contact your representatives. We actually read those messages.'
    }

    return `\n\n${closings[personality.npc_code] || 'Stay engaged and keep learning!'}`
  }

  private getPersonalityTraits(personality: CivicPersonality): string[] {
    const traits = [
      `${personality.profession} perspective`,
      `${personality.political_engagement_level} political engagement`,
      `${personality.communication_style} communication style`,
      `${personality.base_skill_level} expertise level`
    ]

    // Add personality-specific traits
    if (personality.humor_level > 3) traits.push('Uses humor to engage')
    if (personality.encouragement_style === 'supportive') traits.push('Supportive and encouraging')
    if (personality.chattiness_level > 4) traits.push('Conversational and detailed')

    return traits
  }

  // =============================================================================
  // TOOL INTEGRATION
  // =============================================================================

  /**
   * Get assigned personality for a specific AI tool
   */
  getToolPersonality(toolName: string): CivicPersonality | null {
    return this.toolPersonalities.get(toolName) || null
  }

  /**
   * Create personality-driven prompts for AI tools
   */
  createPersonalityPrompt(
    personality: CivicPersonality,
    basePrompt: string,
    context?: any
  ): string {
    const personalityContext = `
      You are ${personality.display_name} (${personality.emoji}), ${personality.byline}.
      
      Background: ${personality.background_story}
      
      Your expertise: ${personality.preferred_topics.join(', ')}
      Communication style: ${personality.communication_style}
      Approach: ${personality.encouragement_style}
      
      Respond as ${personality.first_name} would, incorporating your unique perspective and experience.
      Your motivation: ${personality.learning_motivation}
    `

    return `${personalityContext}\n\n${basePrompt}`
  }

  // =============================================================================
  // UTILITY METHODS
  // =============================================================================

  private skillLevelMatches(
    personalityLevel: string,
    userLevel: string
  ): boolean {
    const levels = ['beginner', 'intermediate', 'advanced', 'expert']
    const pIndex = levels.indexOf(personalityLevel)
    const uIndex = levels.indexOf(userLevel)
    
    // Good match if personality is at user level or one level above
    return pIndex >= uIndex && pIndex <= uIndex + 1
  }

  /**
   * Get all available personalities
   */
  async getAllPersonalities(): Promise<CivicPersonality[]> {
    await this.loadPersonalities()
    return Array.from(this.personalities.values())
  }

  /**
   * Get personality by code
   */
  async getPersonality(npcCode: string): Promise<CivicPersonality | null> {
    await this.loadPersonalities()
    return this.personalities.get(npcCode) || null
  }

  /**
   * Search personalities by criteria
   */
  async searchPersonalities(criteria: {
    profession?: string
    skill_level?: string
    topics?: string[]
    political_engagement?: string
  }): Promise<CivicPersonality[]> {
    await this.loadPersonalities()
    
    return Array.from(this.personalities.values()).filter(personality => {
      if (criteria.profession && !personality.profession.toLowerCase().includes(criteria.profession.toLowerCase())) {
        return false
      }
      if (criteria.skill_level && personality.base_skill_level !== criteria.skill_level) {
        return false
      }
      if (criteria.political_engagement && personality.political_engagement_level !== criteria.political_engagement) {
        return false
      }
      if (criteria.topics) {
        const hasTopicMatch = criteria.topics.some(topic => 
          personality.preferred_topics.some(prefTopic => 
            prefTopic.toLowerCase().includes(topic.toLowerCase())
          )
        )
        if (!hasTopicMatch) return false
      }
      return true
    })
  }
}

// =============================================================================
// SINGLETON INSTANCE
// =============================================================================

let personalityManagerInstance: PersonalityManager | null = null

export function getPersonalityManager(): PersonalityManager {
  if (!personalityManagerInstance) {
    personalityManagerInstance = new PersonalityManager()
  }
  return personalityManagerInstance
}

export default PersonalityManager 