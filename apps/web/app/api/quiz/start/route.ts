import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@civicsense/shared/lib/supabase/server'
import { quizAttemptOperations } from '@civicsense/shared/lib/database'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    const body = await request.json()
    const { 
      topicId, 
      gameMode = 'standard', 
      modeSettings,
      platform = 'web',
      podId,
      classroomCourseId,
      classroomAssignmentId,
      cleverSectionId,
      cleverAssignmentId
    } = body

    if (!topicId) {
      return NextResponse.json(
        { error: 'Topic ID is required' },
        { status: 400 }
      )
    }

    // For guest users, generate a session ID
    let attemptId: string
    
    if (user) {
      // Create database attempt for authenticated users
      try {
        const attempt = await quizAttemptOperations.start(
          user.id,
          topicId,
          25 // Default question count, will be updated when questions load
        )
        attemptId = attempt.id
      } catch (error) {
        console.error('Error creating quiz attempt:', error)
        // Continue with generated ID if database fails
        attemptId = `guest-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      }
    } else {
      // Generate session ID for guest users
      attemptId = `guest-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    }

    // Log the attempt start
    console.log('🎯 Quiz attempt started:', {
      attemptId,
      topicId,
      gameMode,
      userId: user?.id || 'guest',
      platform,
      podId,
      classroomCourseId
    })

    return NextResponse.json({
      success: true,
      attemptId,
      gameMode,
      topicId,
      redirectUrl: gameMode === 'npc_battle' 
        ? `/quiz/${topicId}/battle` 
        : `/quiz/${topicId}/play`
    })

  } catch (error) {
    console.error('Error starting quiz:', error)
    return NextResponse.json(
      { error: 'Failed to start quiz' },
      { status: 500 }
    )
  }
} 