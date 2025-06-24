import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check admin access
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (!profile?.is_admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Sample surveys to create
    const sampleSurveys = [
      {
        title: "CivicSense User Experience Survey",
        description: "Help us understand how you use CivicSense and what features matter most to you.",
        status: "active",
        allow_anonymous: true,
        allow_partial_responses: true,
        estimated_time: 5,
        questions: [
          {
            type: "multiple_choice",
            question: "How often do you use CivicSense?",
            description: "Select the frequency that best describes your usage",
            required: true,
            options: ["Daily", "Weekly", "Monthly", "Rarely"]
          },
          {
            type: "scale",
            question: "How would you rate your overall experience with CivicSense?",
            required: true,
            scale_min: 1,
            scale_max: 5,
            scale_labels: { min: "Poor", max: "Excellent" }
          },
          {
            type: "textarea",
            question: "What features would you like to see added to CivicSense?",
            required: false
          }
        ]
      },
      {
        title: "Democratic Participation Survey",
        description: "Understanding civic engagement patterns in the CivicSense community.",
        status: "active",
        allow_anonymous: true,
        allow_partial_responses: true,
        estimated_time: 8,
        questions: [
          {
            type: "multiple_choice",
            question: "How often do you vote in local elections?",
            required: true,
            options: ["Always", "Usually", "Sometimes", "Never"]
          },
          {
            type: "multiple_select",
            question: "Which civic activities have you participated in? (Select all that apply)",
            required: false,
            options: ["Town halls", "Community organizing", "Contacting representatives", "Protests/rallies", "Volunteer work"]
          },
          {
            type: "yes_no",
            question: "Has using CivicSense increased your interest in civic participation?",
            required: true
          }
        ]
      },
      {
        title: "Content Feedback Survey",
        description: "Feedback on CivicSense's educational content and quiz quality.",
        status: "draft",
        allow_anonymous: false,
        allow_partial_responses: true,
        estimated_time: 10,
        questions: [
          {
            type: "rating_stars",
            question: "How would you rate the quality of CivicSense quiz questions?",
            required: true
          },
          {
            type: "multiple_choice",
            question: "Which topic areas are you most interested in?",
            required: true,
            options: ["Constitutional Law", "Local Government", "Federal Policy", "International Affairs", "Political History"]
          },
          {
            type: "scale",
            question: "How challenging do you find the quiz questions?",
            required: true,
            scale_min: 1,
            scale_max: 5,
            scale_labels: { min: "Too Easy", max: "Too Hard" }
          }
        ]
      }
    ]

    const createdSurveys = []

    for (const surveyData of sampleSurveys) {
      // Create survey
      const { data: survey, error: surveyError } = await supabase
        .from('surveys')
        .insert({
          title: surveyData.title,
          description: surveyData.description,
          status: surveyData.status,
          allow_anonymous: surveyData.allow_anonymous,
          allow_partial_responses: surveyData.allow_partial_responses,
          estimated_time: surveyData.estimated_time,
          created_by: user.id,
          published_at: surveyData.status === 'active' ? new Date().toISOString() : null
        })
        .select()
        .single()

      if (surveyError) {
        console.error('Error creating sample survey:', surveyError)
        continue
      }

      // Create questions
      const questionsWithSurveyId = surveyData.questions.map((q: any, index: number) => ({
        survey_id: survey.id,
        question_order: index + 1,
        question_type: q.type,
        question_text: q.question,
        description: q.description,
        required: q.required || false,
        options: q.options ? JSON.stringify(q.options) : null,
        scale_config: q.scale_min ? JSON.stringify({
          min: q.scale_min,
          max: q.scale_max,
          labels: q.scale_labels
        }) : null
      }))

      const { error: questionsError } = await supabase
        .from('survey_questions')
        .insert(questionsWithSurveyId)

      if (questionsError) {
        console.error('Error creating sample questions:', questionsError)
        // Don't delete the survey, just continue
      }

      createdSurveys.push({
        id: survey.id,
        title: survey.title,
        questionsCount: surveyData.questions.length
      })
    }

    return NextResponse.json({
      message: `Created ${createdSurveys.length} sample surveys`,
      surveys: createdSurveys
    })

  } catch (error) {
    console.error('Error creating sample surveys:', error)
    return NextResponse.json({ error: 'Internal server error', details: error }, { status: 500 })
  }
} 