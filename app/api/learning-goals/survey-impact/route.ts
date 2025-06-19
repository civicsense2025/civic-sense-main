import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
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

interface LearningGoalUpdate {
  id: string
  title: string
  description: string
  previousProgress: number
  newProgress: number
  progressChange: number
  impactedSkills: string[]
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
    
    if (!user) {
      // For anonymous users, return empty goals for now
      return NextResponse.json({ goals: [] })
    }

    // Get survey and its learning goal mappings
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

    if (!survey || !survey.survey_learning_goals) {
      return NextResponse.json({ goals: [] })
    }

    // Get user's current skill progress
    const { data: userSkills } = await serviceSupabase
      .from('user_skills')
      .select('*')
      .eq('user_id', user.id)

    const userSkillsMap = new Map(
      userSkills?.map(skill => [skill.skill_id, skill]) || []
    )

    const updatedGoals: LearningGoalUpdate[] = []

    // Process each learning goal mapping
    for (const goalMapping of survey.survey_learning_goals) {
      const skill = goalMapping.skills as any
      if (!skill) continue

      // Calculate impact based on survey responses
      const impact = calculateSkillImpact(responses, goalMapping)
      
      if (impact.progressGain > 0) {
        const currentUserSkill = userSkillsMap.get(skill.id)
        const previousProgress = currentUserSkill?.progress_percentage || 0
        const newProgress = Math.min(100, previousProgress + impact.progressGain)
        
        // Update user skill progress
        await serviceSupabase
          .from('user_skills')
          .upsert({
            user_id: user.id,
            skill_id: skill.id,
            progress_percentage: newProgress,
            last_practiced: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })

        updatedGoals.push({
          id: skill.id,
          title: skill.name,
          description: skill.description || `Track your progress in ${skill.name}`,
          previousProgress,
          newProgress,
          progressChange: impact.progressGain,
          impactedSkills: impact.relatedSkills
        })
      }
    }

    // Also update general civic engagement metrics
    if (responses.length > 0) {
      await updateCivicEngagementMetrics(user.id, responses, surveyId)
    }

    return NextResponse.json({ 
      goals: updatedGoals,
      total: updatedGoals.length,
      surveyTitle: survey.title
    })
  } catch (error) {
    console.error('Error processing learning goal impact:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function calculateSkillImpact(responses: SurveyResponse[], goalMapping: any) {
  const impact = {
    progressGain: 0,
    relatedSkills: [] as string[],
    confidence: 0
  }

  const skill = goalMapping.skills
  const weight = goalMapping.weight || 1.0
  const questionMappings = goalMapping.question_mappings || {}

  // Find responses that map to this skill
  const relevantResponses = responses.filter(response => {
    return questionMappings.questionIds?.includes(response.question_id) ||
           questionMappings.allQuestions === true
  })

  if (relevantResponses.length === 0) {
    return impact
  }

  // Calculate progress gain based on response quality and completeness
  let totalScore = 0
  let maxPossibleScore = 0

  for (const response of relevantResponses) {
    const { answer } = response
    let responseScore = 0
    let maxScore = 1

    // Score different answer types
    if (typeof answer === 'number') {
      // Scale/rating questions
      if (answer >= 1 && answer <= 10) {
        responseScore = answer / 10
        maxScore = 1
      } else if (answer >= 1 && answer <= 5) {
        responseScore = answer / 5
        maxScore = 1
      }
    } else if (typeof answer === 'string' && answer.trim()) {
      // Text responses - give credit for thoughtful answers
      responseScore = Math.min(1, answer.length / 50) // Up to 50 chars = full credit
      maxScore = 1
    } else if (Array.isArray(answer) && answer.length > 0) {
      // Multiple select - credit for engagement
      responseScore = Math.min(1, answer.length / 3) // Up to 3 selections = full credit
      maxScore = 1
    } else if (answer === true || answer === 'yes' || 
               (typeof answer === 'string' && answer.toLowerCase().includes('yes'))) {
      // Boolean/yes-no responses - full credit for positive engagement
      responseScore = 1
      maxScore = 1
    }

    totalScore += responseScore
    maxPossibleScore += maxScore
  }

  // Calculate base progress gain (0-10% based on performance)
  const completionRatio = maxPossibleScore > 0 ? totalScore / maxPossibleScore : 0
  const baseGain = completionRatio * 10 * weight // Up to 10% progress gain

  // Apply skill-specific multipliers
  let multiplier = 1.0
  const skillCategory = skill.category?.toLowerCase() || ''
  
  // Higher multiplier for civic engagement skills
  if (skillCategory.includes('civic') || skillCategory.includes('engagement')) {
    multiplier = 1.5
  } else if (skillCategory.includes('critical thinking') || skillCategory.includes('analysis')) {
    multiplier = 1.3
  }

  impact.progressGain = Math.round(baseGain * multiplier * 100) / 100 // Round to 2 decimals
  impact.confidence = completionRatio
  
  // Find related skills that might also benefit
  if (skill.category) {
    impact.relatedSkills = [skill.category]
  }

  return impact
}

async function updateCivicEngagementMetrics(
  userId: string, 
  responses: SurveyResponse[], 
  surveyId: string
) {
  try {
    // Update user engagement statistics
    const engagementData = {
      surveys_completed: 1,
      total_questions_answered: responses.length,
      last_survey_date: new Date().toISOString(),
      civic_engagement_score: calculateCivicEngagementScore(responses)
    }

    // Try to update existing record or create new one
    const { data: existingStats } = await serviceSupabase
      .from('user_civic_stats')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (existingStats) {
      // Update existing stats
      await serviceSupabase
        .from('user_civic_stats')
        .update({
          surveys_completed: existingStats.surveys_completed + 1,
          total_questions_answered: existingStats.total_questions_answered + responses.length,
          last_survey_date: new Date().toISOString(),
          civic_engagement_score: Math.max(
            existingStats.civic_engagement_score || 0,
            engagementData.civic_engagement_score
          ),
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
    } else {
      // Create new stats record
      await serviceSupabase
        .from('user_civic_stats')
        .insert({
          user_id: userId,
          ...engagementData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
    }
  } catch (error) {
    console.error('Error updating civic engagement metrics:', error)
    // Don't throw error - this is supplementary data
  }
}

function calculateCivicEngagementScore(responses: SurveyResponse[]): number {
  let score = 0
  let maxScore = 0

  for (const response of responses) {
    const { answer } = response
    maxScore += 10 // Each question can contribute up to 10 points

    if (typeof answer === 'number') {
      score += Math.min(10, answer * 2) // Scale numeric answers
    } else if (typeof answer === 'string' && answer.trim()) {
      // Award points for text engagement
      score += Math.min(10, answer.length / 10)
    } else if (Array.isArray(answer)) {
      // Award points for multiple selections
      score += Math.min(10, answer.length * 2)
    } else if (answer) {
      score += 5 // Basic engagement
    }
  }

  // Return score as percentage (0-100)
  return maxScore > 0 ? Math.round((score / maxScore) * 100) : 0
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const url = new URL(request.url)
    const userId = url.searchParams.get('user_id')

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()

    if (!user && !userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const targetUserId = userId || user?.id

    // Get user's learning goal progress
    const { data: userSkills } = await serviceSupabase
      .from('user_skills')
      .select(`
        *,
        skills (
          id,
          name,
          description,
          category
        )
      `)
      .eq('user_id', targetUserId)
      .order('progress_percentage', { ascending: false })

    // Get civic engagement stats
    const { data: civicStats } = await serviceSupabase
      .from('user_civic_stats')
      .select('*')
      .eq('user_id', targetUserId)
      .single()

    return NextResponse.json({ 
      skills: userSkills || [],
      civicStats: civicStats || null,
      userId: targetUserId
    })
  } catch (error) {
    console.error('Error fetching learning goals:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 