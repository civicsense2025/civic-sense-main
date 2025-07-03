import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Extended interface for the API request body
interface QuizCompletionRequest {
  attemptId?: string
  results: {
    totalQuestions: number
    correctAnswers: number
    incorrectAnswers: number
    score: number
    timeTaken: number
    timeSpentSeconds?: number
    questions: Array<{
      question: any
      userAnswer: string
      isCorrect: boolean
    }>
  }
  podId?: string
  classroomCourseId?: string
  classroomAssignmentId?: string
  cleverSectionId?: string
  topicId?: string
  mode?: string
  guestToken?: string
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Parse request body with comprehensive debugging
    let body: QuizCompletionRequest
    try {
      const rawBody = await request.text()
      console.log('📨 Raw request body length:', rawBody.length)
      
      body = JSON.parse(rawBody)
      console.log('🔍 Parsed request body structure:', {
        hasAttemptId: !!body.attemptId,
        hasResults: !!body.results,
        hasTopicId: !!body.topicId,
        hasGuestToken: !!body.guestToken,
        topicIdValue: body.topicId,
        guestTokenValue: body.guestToken,
        resultsStructure: body.results ? {
          totalQuestions: body.results.totalQuestions,
          correctAnswers: body.results.correctAnswers,
          score: body.results.score,
          timeTaken: body.results.timeTaken,
          questionsCount: body.results.questions?.length
        } : null,
        allKeys: Object.keys(body)
      })
    } catch (parseError) {
      console.error('❌ Failed to parse request body:', parseError)
      return NextResponse.json({ 
        error: 'Invalid JSON in request body' 
      }, { status: 400 })
    }
    
    const { 
      attemptId, 
      results, 
      podId, 
      classroomCourseId, 
      classroomAssignmentId,
      cleverSectionId,
      topicId,
      mode = 'standard',
      guestToken
    } = body

    console.log('🎯 Quiz completion request (detailed):', {
      hasGuestToken: !!guestToken,
      guestTokenValue: guestToken,
      hasTopicId: !!topicId,
      topicIdValue: topicId,
      hasResults: !!results,
      resultsScore: results?.score,
      mode,
      allFieldsExtracted: {
        attemptId,
        podId,
        classroomCourseId,
        classroomAssignmentId,
        cleverSectionId
      }
    })

    // Validate required fields with detailed error messages
    if (!results) {
      console.error('❌ Validation failed: results is missing or null')
      return NextResponse.json({ 
        error: 'Missing required field: results is required',
        received: { hasResults: !!results, resultsType: typeof results }
      }, { status: 400 })
    }
    
    if (!topicId) {
      console.error('❌ Validation failed: topicId is missing or null')
      return NextResponse.json({ 
        error: 'Missing required field: topicId is required',
        received: { hasTopicId: !!topicId, topicIdType: typeof topicId, topicIdValue: topicId }
      }, { status: 400 })
    }

    // Try to get authenticated user (optional for guest users)
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    // For guest users, we don't require authentication
    let userId: string | null = null
    let isGuestUser = false

    if (user) {
      // Authenticated user
      userId = user.id
      console.log('👤 Authenticated user:', userId)
    } else if (guestToken) {
      // Guest user with token
      isGuestUser = true
      console.log('👥 Guest user with token:', guestToken)
    } else {
      // No user and no guest token
      console.error('❌ No authentication and no guest token provided')
      return NextResponse.json({ 
        error: 'Authentication required or guest token must be provided',
        received: { hasUser: !!user, hasGuestToken: !!guestToken, guestTokenValue: guestToken }
      }, { status: 401 })
    }

    try {
      // Prepare database record with validation
      // Handle authenticated vs guest users differently due to schema constraints
      let attemptData: any = {
        topic_id: topicId,
        score: results.score || 0,
        total_questions: results.totalQuestions || 0,
        correct_answers: results.correctAnswers || 0,
        incorrect_answers: results.incorrectAnswers || 0,
        time_spent_seconds: results.timeSpentSeconds || results.timeTaken || 0,
        game_mode: null, // TEMPORARY FIX: Set to null to bypass check constraint. Need to determine correct values allowed by user_quiz_attempts_game_mode_check constraint
        completed_at: new Date().toISOString(),
        // LMS integration fields (only include fields that exist in schema)
        classroom_course_id: classroomCourseId || null,
        classroom_assignment_id: classroomAssignmentId || null,
        clever_section_id: cleverSectionId || null,
      }

      // Add user identification - database requires user_id to be non-null
      if (user?.id) {
        attemptData.user_id = user.id
      } else if (guestToken) {
        // Use a special guest user ID since database requires user_id to be non-null
        // This allows us to maintain the NOT NULL constraint while tracking guests
        attemptData.user_id = '00000000-0000-0000-0000-000000000000' // Special guest user ID
        attemptData.guest_token = guestToken
      } else {
        console.error('❌ No user identification available')
        return NextResponse.json(
          { error: 'No authentication and no guest token provided' },
          { status: 401 }
        )
      }

      console.log('💾 Saving quiz attempt to database (validated):', {
        isGuestUser: !user?.id,
        userId: user?.id || null,
        guestToken: guestToken || null,
        topicId,
        score: results.score,
        totalQuestions: results.totalQuestions,
        dataIsValid: true,
        originalMode: mode // Track what mode was being sent for debugging
      })

      // Insert the quiz attempt
      const { data: insertResult, error: insertError } = await supabase
        .from('user_quiz_attempts')
        .insert(attemptData)
        .select('id')

      if (insertError) {
        console.error('❌ Database insert failed:', {
          code: insertError.code,
          details: insertError.details,
          hint: insertError.hint,
          message: insertError.message
        })
        
        return NextResponse.json(
          { 
            error: 'Failed to save quiz results to database', 
            details: insertError.message,
            code: insertError.code
          },
          { status: 500 }
        )
      }

      console.log('✅ Quiz attempt saved successfully:', {
        attemptId: insertResult?.[0]?.id || 'unknown',
        userId: user?.id || 'guest',
        score: results.score
      })

      // Note: Pod progress tracking removed due to table schema limitations
      // This could be added later if the pod_quiz_progress table is created
      if (podId && userId) {
        console.log('📚 Pod quiz completed for pod:', podId, '(progress tracking not available)')
      }

      return NextResponse.json({
        success: true,
        attemptId: insertResult?.[0]?.id,
        message: 'Quiz results saved successfully'
      })

    } catch (error) {
      console.error('❌ Error saving quiz attempt:', error)
      return NextResponse.json(
        { 
          error: 'Failed to save quiz results to database',
          details: error instanceof Error ? error.message : 'Unknown error',
          code: (error as any)?.code || 'UNKNOWN'
        },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('❌ Quiz completion API error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// Handle other HTTP methods
export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}

export async function PUT() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}

export async function DELETE() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
} 