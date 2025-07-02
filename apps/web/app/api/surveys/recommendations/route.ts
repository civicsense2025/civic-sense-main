import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@civicsense/shared/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

// Create service role client for operations that need elevated permissions
const serviceSupabase = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface SurveyResponse {
  question_id: string
  answer: any
  answered_at: string
}

interface RecommendedContent {
  id: string
  title: string
  description: string
  type: 'quiz' | 'article' | 'topic' | 'skill'
  url: string
  difficulty?: string
  estimatedTime?: number
  relevanceScore: number
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    const { surveyId, responses }: { surveyId: string; responses: SurveyResponse[] } = body

    if (!surveyId || !responses || !Array.isArray(responses)) {
      return NextResponse.json({ error: 'Survey ID and responses are required' }, { status: 400 })
    }

    // Get current user (might be null for anonymous)
    const { data: { user } } = await supabase.auth.getUser()
    
    // Get survey details and associated learning goals
    const { data: survey } = await serviceSupabase
      .from('surveys')
      .select(`
        id,
        title,
        survey_learning_goals (
          skill_id,
          weight,
          question_mappings,
          skills (
            id,
            name,
            description,
            category
          )
        )
      `)
      .eq('id', surveyId)
      .single()

    if (!survey) {
      return NextResponse.json({ error: 'Survey not found' }, { status: 404 })
    }

    // Analyze responses to determine user interests and knowledge gaps
    const analysisResults = await analyzeResponses(responses, survey)
    
    // Generate recommendations based on analysis
    const recommendations = await generateRecommendations(analysisResults, user?.id)

    // Store recommendations for future reference
    if (recommendations.length > 0) {
      const { error: storeError } = await serviceSupabase
        .from('survey_recommendations')
        .upsert({
          user_id: user?.id || null,
          guest_token: user ? null : `guest-${Date.now()}`, // Generate guest token if needed
          survey_id: surveyId,
          recommended_content: recommendations,
          based_on_responses: analysisResults,
          generated_at: new Date().toISOString()
        })

      if (storeError) {
        console.error('Error storing recommendations:', storeError)
      }
    }

    return NextResponse.json({ 
      recommendations,
      analysis: analysisResults,
      total: recommendations.length
    })
  } catch (error) {
    console.error('Error generating recommendations:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function analyzeResponses(responses: SurveyResponse[], survey: any) {
  const analysis = {
    interests: [] as string[],
    knowledgeAreas: [] as string[],
    skillLevels: {} as Record<string, number>,
    preferredDifficulty: 'beginner' as 'beginner' | 'intermediate' | 'advanced',
    topicPreferences: [] as string[],
    responsePatterns: {} as Record<string, any>
  }

  // Analyze each response
  for (const response of responses) {
    const { question_id, answer } = response

    // For scale/rating questions, determine knowledge level
    if (typeof answer === 'number') {
      if (answer >= 4) {
        analysis.skillLevels[question_id] = answer
        if (answer >= 4) analysis.preferredDifficulty = 'intermediate'
        if (answer >= 5) analysis.preferredDifficulty = 'advanced'
      }
    }

    // For multiple choice, extract topic interests
    if (typeof answer === 'string') {
      // Check if answer indicates interest in specific civic topics
      const civicTopics = [
        'voting', 'elections', 'government', 'policy', 'constitution', 
        'congress', 'supreme court', 'local government', 'democracy',
        'civic engagement', 'public policy', 'political process'
      ]
      
      const lowerAnswer = answer.toLowerCase()
      for (const topic of civicTopics) {
        if (lowerAnswer.includes(topic)) {
          analysis.interests.push(topic)
          analysis.topicPreferences.push(topic)
        }
      }
    }

    // For multiple select, gather broader interests
    if (Array.isArray(answer)) {
      answer.forEach(item => {
        if (typeof item === 'string') {
          analysis.interests.push(item.toLowerCase())
        }
      })
    }
  }

  // Use survey learning goals to map responses to skills
  if (survey.survey_learning_goals) {
    for (const goalMapping of survey.survey_learning_goals) {
      const skill = goalMapping.skills
      if (skill && goalMapping.question_mappings) {
        // Check if any responses match this skill's question mappings
        const relevantResponses = responses.filter(r => 
          goalMapping.question_mappings.questionIds?.includes(r.question_id)
        )
        
        if (relevantResponses.length > 0) {
          analysis.knowledgeAreas.push(skill.name)
          
          // Calculate average score for this skill
          const scores = relevantResponses
            .map(r => typeof r.answer === 'number' ? r.answer : 0)
            .filter(score => score > 0)
          
          if (scores.length > 0) {
            const avgScore = scores.reduce((sum, score) => sum + score, 0) / scores.length
            analysis.skillLevels[skill.id] = avgScore * goalMapping.weight
          }
        }
      }
    }
  }

  // Clean up duplicates
  analysis.interests = [...new Set(analysis.interests)]
  analysis.knowledgeAreas = [...new Set(analysis.knowledgeAreas)]
  analysis.topicPreferences = [...new Set(analysis.topicPreferences)]

  return analysis
}

async function generateRecommendations(
  analysis: any, 
  userId?: string
): Promise<RecommendedContent[]> {
  const recommendations: RecommendedContent[] = []

  try {
    // Get related quizzes based on interests and knowledge areas
    const { data: quizzes } = await serviceSupabase
      .from('questions')
      .select(`
        topic_id,
        difficulty,
        topics (
          id,
          title,
          description,
          slug,
          category
        )
      `)
      .not('topics', 'is', null)
      .limit(20)

    if (quizzes) {
      // Score and rank topics based on user analysis
      const topicScores: Record<string, { topic: any; score: number; count: number }> = {}
      
      for (const quiz of quizzes) {
        if (!quiz.topics) continue
        
        const topic = quiz.topics as any
        const topicId = topic.id
        
        if (!topicScores[topicId]) {
          topicScores[topicId] = { topic, score: 0, count: 0 }
        }
        
        let score = 0
        topicScores[topicId].count++
        
        // Score based on interest keywords
        const topicText = `${topic.title || ''} ${topic.description || ''}`.toLowerCase()
        for (const interest of analysis.interests) {
          if (topicText.includes(interest)) {
            score += 0.3
          }
        }
        
        // Score based on category match
        if (analysis.knowledgeAreas.some((area: string) => 
          topic.category?.toLowerCase().includes(area.toLowerCase())
        )) {
          score += 0.4
        }
        
        // Score based on difficulty preference
        const difficulty = quiz.difficulty || 'beginner'
        const difficultyScore = {
          'beginner': analysis.preferredDifficulty === 'beginner' ? 1 : 0.5,
          'intermediate': analysis.preferredDifficulty === 'intermediate' ? 1 : 0.7,
          'advanced': analysis.preferredDifficulty === 'advanced' ? 1 : 0.6
        }[difficulty as 'beginner' | 'intermediate' | 'advanced'] || 0.5
        
        score += difficultyScore * 0.3
        
        topicScores[topicId].score += score
      }
      
      // Convert to recommendations and sort by score
      const topicRecommendations = Object.values(topicScores)
        .map(({ topic, score, count }) => ({
          id: topic.id,
          title: topic.title,
          description: topic.description || `Learn about ${topic.title}`,
          type: 'quiz' as const,
          url: `/quiz/${topic.slug || topic.id}`,
          difficulty: analysis.preferredDifficulty,
          estimatedTime: Math.max(5, Math.min(15, count * 2)), // Estimate based on question count
          relevanceScore: Math.round((score / Math.max(count, 1)) * 100)
        }))
        .filter(rec => rec.relevanceScore > 30) // Only show relevant recommendations
        .sort((a, b) => b.relevanceScore - a.relevanceScore)
        .slice(0, 6) // Limit to top 6
      
      recommendations.push(...topicRecommendations)
    }

    // Get related skills based on analysis
    const { data: skills } = await serviceSupabase
      .from('skills')
      .select('*')
      .limit(10)

    if (skills) {
      const skillRecommendations = skills
        .map(skill => {
          let score = 0
          
          // Score based on knowledge areas
          if (analysis.knowledgeAreas.some((area: string) => 
            skill.name.toLowerCase().includes(area.toLowerCase()) ||
            skill.description?.toLowerCase().includes(area.toLowerCase())
          )) {
            score += 0.6
          }
          
          // Score based on interests
          const skillText = `${skill.name} ${skill.description}`.toLowerCase()
          for (const interest of analysis.interests) {
            if (skillText.includes(interest)) {
              score += 0.2
            }
          }
          
          return {
            id: skill.id,
            title: `Master: ${skill.name}`,
            description: skill.description || `Develop your ${skill.name} skills`,
            type: 'skill' as const,
            url: `/skills/${skill.id}`,
            difficulty: analysis.preferredDifficulty,
            estimatedTime: 20,
            relevanceScore: Math.round(score * 100)
          }
        })
        .filter(rec => rec.relevanceScore > 40)
        .sort((a, b) => b.relevanceScore - a.relevanceScore)
        .slice(0, 3)
      
      recommendations.push(...skillRecommendations)
    }

    // Add some general civic engagement content based on interests
    if (analysis.interests.includes('voting') || analysis.interests.includes('elections')) {
      recommendations.push({
        id: 'voting-guide',
        title: 'Complete Voting Guide',
        description: 'Everything you need to know about voting in your area',
        type: 'article',
        url: '/guides/voting',
        difficulty: 'beginner',
        estimatedTime: 10,
        relevanceScore: 85
      })
    }

    if (analysis.interests.includes('local government') || analysis.topicPreferences.includes('local government')) {
      recommendations.push({
        id: 'local-engagement',
        title: 'Local Government Engagement',
        description: 'How to get involved in your local community',
        type: 'topic',
        url: '/topics/local-government',
        difficulty: 'intermediate',
        estimatedTime: 15,
        relevanceScore: 80
      })
    }

  } catch (error) {
    console.error('Error generating recommendations:', error)
  }

  // Sort final recommendations by relevance score
  return recommendations
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, 8) // Limit total recommendations
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const url = new URL(request.url)
    const userId = url.searchParams.get('user_id')
    const guestToken = url.searchParams.get('guest_token')

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()

    if (!user && !guestToken) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Fetch user's recent recommendations
    let query = serviceSupabase
      .from('survey_recommendations')
      .select(`
        id,
        survey_id,
        recommended_content,
        based_on_responses,
        generated_at,
        viewed_at,
        clicked_items,
        surveys (
          title
        )
      `)
      .order('generated_at', { ascending: false })
      .limit(10)

    if (user) {
      query = query.eq('user_id', user.id)
    } else if (guestToken) {
      query = query.eq('guest_token', guestToken)
    }

    const { data: recommendations, error } = await query

    if (error) {
      console.error('Error fetching recommendations:', error)
      return NextResponse.json({ error: 'Failed to fetch recommendations' }, { status: 500 })
    }

    return NextResponse.json({ recommendations: recommendations || [] })
  } catch (error) {
    console.error('Error in recommendations GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 