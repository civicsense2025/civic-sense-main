import { supabase } from "./supabase"

interface UserLearningProfile {
  userId: string
  preferredCategories: string[]
  difficultyPreference: number
  learningGoals: string[]
  weakAreas: string[]
  strongAreas: string[]
  recentTopics: string[]
  averageAccuracy: number
  preferredQuestionTypes: string[]
  skillProgress: Array<{
    skillId: string
    skillName: string
    category: string
    skillLevel: number
    confidenceLevel: number
    masteryLevel: string
    needsPractice: boolean
    daysSincePractice: number | null
  }>
  skillGaps: Array<{
    skillId: string
    skillName: string
    category: string
    gapSeverity: number
    prerequisitesMet: boolean
  }>
}

interface DeckRequest {
  name: string
  description?: string
  targetQuestionCount: number
  categories?: string[]
  difficultyRange?: [number, number]
  learningObjective?: string
  timeConstraint?: number // minutes
  focusAreas?: string[]
  targetSkills?: string[]
  skillLearningMode?: 'remediation' | 'advancement' | 'mixed'
}

export interface AIEnhancedDeck {
  name: string
  description: string
  questions: Array<{
    id: string
    question: string
    category: string
    difficulty: number
    tags: string[]
    reasoning: string
    targetSkills: string[]
    skillWeights: Record<string, number>
  }>
  learningPath: string[]
  estimatedTime: number
  difficultyProgression: 'linear' | 'adaptive' | 'mixed'
  aiRecommendations: string[]
  skillFocus: Array<{
    skillName: string
    questionCount: number
    rationale: string
  }>
  actionableOutcomes?: string[]
}

export class AIDeckBuilder {
  private openaiApiKey: string

  constructor() {
    this.openaiApiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY || process.env.OPENAI_API_KEY || ''
    if (!this.openaiApiKey) {
      console.warn('OpenAI API key not found - AI deck building features will be limited')
    }
  }

  async buildUserLearningProfile(userId: string): Promise<UserLearningProfile> {
    try {
      // Get user's quiz history and performance data
      const { data: quizAttempts } = await supabase
        .from('user_quiz_attempts')
        .select('*')
        .eq('user_id', userId)
        .order('completed_at', { ascending: false })
        .limit(50)

      // Get category-level skills (existing)
      const { data: categorySkills } = await supabase
        .from('user_category_skills')
        .select('*')
        .eq('user_id', userId)

      // Get granular skill progress (enhanced)
      const { data: skillProgress } = await supabase
        .from('user_skill_progress')
        .select(`
          *,
          skill:skills(
            id,
            skill_name,
            category:categories(name),
            difficulty_level,
            is_core_skill
          )
        `)
        .eq('user_id', userId)

      const { data: questionResponses } = await supabase
        .from('user_question_responses')
        .select('*')
        .eq('user_id', userId)
        .order('answered_at', { ascending: false })
        .limit(200)

      // Analyze the data to build enhanced profile
      const profile: UserLearningProfile = {
        userId,
        preferredCategories: this.extractPreferredCategories(categorySkills || []),
        difficultyPreference: this.calculateDifficultyPreference(quizAttempts || []),
        learningGoals: [], // Could be extracted from user settings
        weakAreas: this.identifyWeakAreas(categorySkills || []),
        strongAreas: this.identifyStrongAreas(categorySkills || []),
        recentTopics: this.extractRecentTopics(quizAttempts || []),
        averageAccuracy: this.calculateAverageAccuracy(quizAttempts || []),
        preferredQuestionTypes: this.extractPreferredQuestionTypes(questionResponses || []),
        skillProgress: this.processSkillProgress(skillProgress || []),
        skillGaps: await this.identifySkillGaps(userId, skillProgress || [])
      }

      return profile
    } catch (error) {
      console.error('Error building user learning profile:', error)
      // Return default profile
      return {
        userId,
        preferredCategories: [],
        difficultyPreference: 2,
        learningGoals: [],
        weakAreas: [],
        strongAreas: [],
        recentTopics: [],
        averageAccuracy: 0,
        preferredQuestionTypes: [],
        skillProgress: [],
        skillGaps: []
      }
    }
  }

  async generateAIEnhancedDeck(
    userId: string, 
    request: DeckRequest
  ): Promise<AIEnhancedDeck> {
    const userProfile = await this.buildUserLearningProfile(userId)
    
    // Get available questions with their skill mappings
    const availableQuestions = await this.getAvailableQuestionsWithSkills(request.categories)
    
    if (!this.openaiApiKey) {
      // Fallback to rule-based selection if no AI
      return this.generateRuleBasedDeck(userProfile, request, availableQuestions)
    }

    // Use AI to intelligently select and organize questions based on skills
    const aiPrompt = this.buildEnhancedAIPrompt(userProfile, request, availableQuestions)
    const aiResponse = await this.callOpenAI(aiPrompt)
    
    return this.parseAIResponse(aiResponse, availableQuestions, request)
  }

  private buildEnhancedAIPrompt(
    profile: UserLearningProfile, 
    request: DeckRequest, 
    questions: any[]
  ): string {
    const skillProgressText = profile.skillProgress.length > 0 
      ? profile.skillProgress.map(skill => 
          `${skill.skillName}: Level ${skill.skillLevel}/100, ${skill.masteryLevel} (${skill.needsPractice ? 'needs practice' : 'on track'})`
        ).join('\n')
      : null

    const skillGapsText = profile.skillGaps.length > 0
      ? profile.skillGaps.map(gap => 
          `${gap.skillName}: Gap severity ${gap.gapSeverity}/100 (${gap.prerequisitesMet ? 'ready to learn' : 'prerequisites needed'})`
        ).join('\n')
      : null

    return `You are an expert civic education tutor focused on building PRACTICAL, ACTION-ORIENTED skills that people can use immediately in their daily lives.

CORE PHILOSOPHY: Every civic concept should connect to real-world action and transferable life skills. Frame learning as "building skills you'll actually use" rather than abstract knowledge.

USER PROFILE:
- Preferred categories: ${profile.preferredCategories.join(', ')}
- Weak areas needing action-focused practice: ${profile.weakAreas.join(', ')}
- Strong areas to build upon: ${profile.strongAreas.join(', ')}
- Average accuracy: ${profile.averageAccuracy}%
- Learning goals: ${profile.learningGoals.join(', ')}

SKILL PROGRESS (Focus on practical application gaps):
${skillProgressText || 'No skill progress data available'}

SKILL GAPS (Prioritize actionable skills):
${skillGapsText || 'No specific skill gaps identified'}

DECK REQUEST:
- Name: ${request.name}
- Description: ${request.description || 'Custom learning deck'}
- Target questions: ${request.targetQuestionCount}
- Categories: ${request.categories?.join(', ') || 'Any'}
- Difficulty range: ${request.difficultyRange?.[0] || 1}-${request.difficultyRange?.[1] || 4}
- Learning objective: ${request.learningObjective || 'General improvement'}
- Time constraint: ${request.timeConstraint || 30} minutes
- Skill learning mode: ${request.skillLearningMode || 'mixed'}

AVAILABLE QUESTIONS: ${questions.length} questions available with skill mappings

INSTRUCTIONS FOR ACTION-ORIENTED DECK BUILDING:
1. PRIORITIZE PRACTICAL SKILLS (70% of deck): Focus on skills people can immediately apply:
   - "Research Candidates" over "Electoral Systems Theory"
   - "Contact Representatives" over "Legislative Structure"
   - "Fact-Check Claims" over "Media Theory"
   - "Know Your Rights" over "Constitutional History"

2. CONNECT TO TRANSFERABLE SKILLS (20% of deck): Show how civic skills apply elsewhere:
   - Budget analysis to Personal finance skills
   - Policy evaluation to Decision-making frameworks
   - Public speaking to Professional communication
   - Research skills to Academic and career success

3. BUILD CONFIDENCE THROUGH ACTION (10% of deck): Include questions that:
   - Show immediate wins and practical applications
   - Demonstrate "you can actually do this stuff"
   - Connect to situations they'll face in real life

4. FRAME LEARNING AS SKILL BUILDING:
   - Instead of "Learn about X" to "Build skill to do X"
   - Instead of "Understand Y" to "Navigate Y situations"
   - Instead of "Know Z" to "Use Z to protect yourself/help others"

5. EMPHASIZE REAL-WORLD SCENARIOS:
   - Questions about actual situations they might face
   - Practical problem-solving over theoretical knowledge
   - "What would you do if..." scenarios

Respond with a JSON object containing:
{
  "selectedQuestionIds": ["id1", "id2", ...],
  "learningPath": ["skill1", "skill2", ...],
  "difficultyProgression": "linear|adaptive|mixed",
  "estimatedTime": number,
  "recommendations": ["action-focused tip1", "practical tip2", ...],
  "skillFocus": [{"skillName": "...", "questionCount": 3, "rationale": "Practical application: ..."}],
  "reasoning": "Why these questions build practical, actionable civic skills",
  "actionableOutcomes": ["After this deck, you'll be able to...", "You can immediately apply this by..."]
}

Focus on creating a deck that makes people think "I can actually use this" rather than "I learned about this."`
  }

  private async callOpenAI(prompt: string): Promise<string> {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.openaiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-2024-11-20',
          messages: [
            {
              role: 'system',
              content: 'You are an expert civic education tutor with deep knowledge of pedagogy and personalized learning.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 1500,
          temperature: 0.7,
        }),
      })

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`)
      }

      const data = await response.json()
      return data.choices[0]?.message?.content || ''
    } catch (error) {
      console.error('Error calling OpenAI:', error)
      throw error
    }
  }

  private async parseAIResponse(
    aiResponse: string, 
    availableQuestions: any[], 
    request: DeckRequest
  ): Promise<AIEnhancedDeck> {
    try {
      const parsed = JSON.parse(aiResponse)
      
      const selectedQuestions = parsed.selectedQuestionIds
        .map((id: string) => availableQuestions.find(q => q.id === id))
        .filter(Boolean)
        .map((q: any) => ({
          id: q.id,
          question: q.question,
          category: q.category,
          difficulty: q.difficulty,
          tags: q.tags || [],
          reasoning: parsed.reasoning,
          targetSkills: q.question_skills?.map((skill: any) => skill.skill?.id) || [],
          skillWeights: q.question_skills?.reduce((acc: any, skill: any) => {
            acc[skill.skill?.id] = skill.skill_weight
            return acc
          }, {} as Record<string, number>) || {}
        }))

      return {
        name: request.name,
        description: request.description || parsed.reasoning,
        questions: selectedQuestions,
        learningPath: parsed.learningPath || [],
        estimatedTime: parsed.estimatedTime || request.timeConstraint || 30,
        difficultyProgression: parsed.difficultyProgression || 'adaptive',
        aiRecommendations: parsed.recommendations || [],
        skillFocus: parsed.skillFocus || [],
        actionableOutcomes: parsed.actionableOutcomes || []
      }
    } catch (error) {
      console.error('Error parsing AI response:', error)
      // Fallback to simple selection
      return this.generateSimpleDeck(request, availableQuestions)
    }
  }

  private generateRuleBasedDeck(
    profile: UserLearningProfile,
    request: DeckRequest,
    questions: any[]
  ): AIEnhancedDeck {
    // Rule-based fallback when AI is not available
    let filteredQuestions = questions

    // Filter by categories if specified
    if (request.categories && request.categories.length > 0) {
      filteredQuestions = filteredQuestions.filter(q => 
        request.categories!.some(cat => q.category.includes(cat))
      )
    }

    // Filter by difficulty range
    if (request.difficultyRange) {
      filteredQuestions = filteredQuestions.filter(q => 
        q.difficulty >= request.difficultyRange![0] && 
        q.difficulty <= request.difficultyRange![1]
      )
    }

    // Prioritize weak areas
    if (profile.weakAreas.length > 0) {
      const weakAreaQuestions = filteredQuestions.filter(q =>
        profile.weakAreas.some(area => q.category.includes(area))
      )
      
      // Take 60% from weak areas, 40% from other areas
      const weakCount = Math.floor(request.targetQuestionCount * 0.6)
      const otherCount = request.targetQuestionCount - weakCount
      
      const selectedWeak = weakAreaQuestions.slice(0, weakCount)
      const selectedOther = filteredQuestions
        .filter(q => !selectedWeak.includes(q))
        .slice(0, otherCount)
      
      filteredQuestions = [...selectedWeak, ...selectedOther]
    }

    // Sort by difficulty for progression
    filteredQuestions.sort((a, b) => a.difficulty - b.difficulty)

    const selectedQuestions = filteredQuestions
      .slice(0, request.targetQuestionCount)
      .map(q => ({
        id: q.id,
        question: q.question,
        category: q.category,
        difficulty: q.difficulty,
        tags: q.tags || [],
        reasoning: 'Selected based on your learning profile and preferences',
        targetSkills: q.question_skills?.map((skill: any) => skill.skill?.id) || [],
        skillWeights: q.question_skills?.reduce((acc: any, skill: any) => {
          acc[skill.skill?.id] = skill.skill_weight
          return acc
        }, {} as Record<string, number>) || {}
      }))

    return {
      name: request.name,
      description: request.description || 'Custom deck tailored to your learning needs',
      questions: selectedQuestions,
      learningPath: [...new Set(selectedQuestions.map(q => q.category))],
      estimatedTime: request.timeConstraint || 30,
      difficultyProgression: 'linear',
      aiRecommendations: [
        'Focus on understanding the concepts behind each question',
        'Take your time with higher difficulty questions',
        'Review explanations for questions you get wrong'
      ],
      skillFocus: [],
      actionableOutcomes: []
    }
  }

  private generateSimpleDeck(request: DeckRequest, questions: any[]): AIEnhancedDeck {
    const selectedQuestions = questions
      .slice(0, request.targetQuestionCount)
      .map(q => ({
        id: q.id,
        question: q.question,
        category: q.category,
        difficulty: q.difficulty,
        tags: q.tags || [],
        reasoning: 'Randomly selected',
        targetSkills: q.question_skills?.map((skill: any) => skill.skill?.id) || [],
        skillWeights: q.question_skills?.reduce((acc: any, skill: any) => {
          acc[skill.skill?.id] = skill.skill_weight
          return acc
        }, {} as Record<string, number>) || {}
      }))

    return {
      name: request.name,
      description: request.description || 'Custom quiz deck',
      questions: selectedQuestions,
      learningPath: [],
      estimatedTime: 30,
      difficultyProgression: 'mixed',
      aiRecommendations: [],
      skillFocus: [],
      actionableOutcomes: []
    }
  }

  private async getAvailableQuestionsWithSkills(categories?: string[]): Promise<any[]> {
    try {
      let query = supabase
        .from('questions')
        .select(`
          id,
          topic_id,
          question_number,
          question_type,
          category,
          question,
          option_a,
          option_b,
          option_c,
          option_d,
          correct_answer,
          hint,
          explanation,
          tags,
          sources,
          difficulty_level,
          question_skills(
            skill_weight,
            is_primary_skill,
            skill:skills(
              id,
              skill_name,
              category:categories(name)
            )
          )
        `)
        .eq('is_active', true)

      if (categories && categories.length > 0) {
        query = query.in('category', categories)
      }

      const { data, error } = await query.limit(1000)

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching questions with skills:', error)
      return []
    }
  }

  // Helper methods for profile analysis
  private extractPreferredCategories(categorySkills: any[]): string[] {
    return categorySkills
      .filter(skill => skill.questions_attempted > 5)
      .sort((a, b) => b.skill_level - a.skill_level)
      .slice(0, 3)
      .map(skill => skill.category)
  }

  private calculateDifficultyPreference(quizAttempts: any[]): number {
    if (quizAttempts.length === 0) return 2

    const avgAccuracy = this.calculateAverageAccuracy(quizAttempts)
    
    // Adjust difficulty preference based on performance
    if (avgAccuracy > 85) return 3 // Prefer harder questions
    if (avgAccuracy > 70) return 2 // Balanced
    return 1 // Prefer easier questions
  }

  private identifyWeakAreas(categorySkills: any[]): string[] {
    return categorySkills
      .filter(skill => skill.questions_attempted > 3 && skill.accuracy_percentage < 60)
      .map(skill => skill.category)
  }

  private identifyStrongAreas(categorySkills: any[]): string[] {
    return categorySkills
      .filter(skill => skill.questions_attempted > 3 && skill.accuracy_percentage > 80)
      .map(skill => skill.category)
  }

  private extractRecentTopics(quizAttempts: any[]): string[] {
    return quizAttempts
      .slice(0, 10)
      .map(attempt => attempt.topic_id)
  }

  private calculateAverageAccuracy(quizAttempts: any[]): number {
    if (quizAttempts.length === 0) return 0

    const totalAccuracy = quizAttempts.reduce((sum, attempt) => 
      sum + (attempt.correct_answers / attempt.total_questions * 100), 0
    )

    return Math.round(totalAccuracy / quizAttempts.length)
  }

  private extractPreferredQuestionTypes(responses: any[]): string[] {
    const typePerformance = responses.reduce((acc, response) => {
      const type = response.question_type || 'multiple_choice'
      if (!acc[type]) {
        acc[type] = { correct: 0, total: 0 }
      }
      acc[type].total++
      if (response.is_correct) {
        acc[type].correct++
      }
      return acc
    }, {} as Record<string, { correct: number; total: number }>)

    return Object.entries(typePerformance)
      .filter(([_, stats]) => {
        const typedStats = stats as { correct: number; total: number }
        return typedStats.total > 5
      })
      .sort(([_, a], [__, b]) => {
        const aStats = a as { correct: number; total: number }
        const bStats = b as { correct: number; total: number }
        return (bStats.correct / bStats.total) - (aStats.correct / aStats.total)
      })
      .slice(0, 3)
      .map(([type]) => type)
  }

  private processSkillProgress(skillProgressData: any[]): UserLearningProfile['skillProgress'] {
    return skillProgressData.map(progress => ({
      skillId: progress.skill_id,
      skillName: progress.skill?.skill_name || 'Unknown Skill',
      category: progress.skill?.category?.name || 'Unknown Category',
      skillLevel: progress.skill_level || 0,
      confidenceLevel: progress.confidence_level || 0,
      masteryLevel: progress.mastery_level || 'novice',
      needsPractice: progress.next_review_date ? new Date(progress.next_review_date) <= new Date() : false,
      daysSincePractice: progress.last_practiced_at 
        ? Math.floor((Date.now() - new Date(progress.last_practiced_at).getTime()) / (1000 * 60 * 60 * 24))
        : null
    }))
  }

  private async identifySkillGaps(userId: string, skillProgressData: any[]): Promise<UserLearningProfile['skillGaps']> {
    try {
      // Get all available skills
      const { data: allSkills } = await supabase
        .from('skills')
        .select(`
          id,
          skill_name,
          category:categories(name),
          is_core_skill,
          difficulty_level
        `)
        .eq('is_active', true)

      if (!allSkills) return []

      const skillGaps: UserLearningProfile['skillGaps'] = []

      for (const skill of allSkills) {
        const userProgress = skillProgressData.find(p => p.skill_id === skill.id)
        
        // Calculate gap severity
        let gapSeverity = 0
        
        if (!userProgress) {
          // No progress at all - high severity for core skills
          gapSeverity = skill.is_core_skill ? 90 : 60
        } else {
          // Has some progress - calculate based on skill level and confidence
          const skillLevel = userProgress.skill_level || 0
          const confidenceLevel = userProgress.confidence_level || 0
          const averageLevel = (skillLevel + confidenceLevel) / 2
          
          // Gap severity inversely related to skill level
          gapSeverity = Math.max(0, 100 - averageLevel)
          
          // Boost severity for core skills
          if (skill.is_core_skill && gapSeverity > 30) {
            gapSeverity = Math.min(100, gapSeverity * 1.3)
          }
        }

        // Check prerequisites (simplified - could be enhanced)
        const prerequisitesMet = true // TODO: Implement prerequisite checking

        if (gapSeverity > 20) { // Only include significant gaps
          skillGaps.push({
            skillId: skill.id,
            skillName: skill.skill_name,
            category: skill.category?.name || 'Unknown',
            gapSeverity: Math.round(gapSeverity),
            prerequisitesMet
          })
        }
      }

      // Sort by gap severity (most urgent first)
      return skillGaps.sort((a, b) => b.gapSeverity - a.gapSeverity)
    } catch (error) {
      console.error('Error identifying skill gaps:', error)
      return []
    }
  }
}

export const aiDeckBuilder = new AIDeckBuilder() 