import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get counts
    const { count: topicsCount, error: topicsCountError } = await supabase
      .from('question_topics')
      .select('*', { count: 'exact', head: true })
    
    const { count: questionsCount, error: questionsCountError } = await supabase
      .from('questions')
      .select('*', { count: 'exact', head: true })

    // Get a sample of topics
    const { data: sampleTopics, error: sampleTopicsError } = await supabase
      .from('question_topics')
      .select('id, topic_id, topic_title')
      .limit(5)

    // Get a sample of questions
    const { data: sampleQuestions, error: sampleQuestionsError } = await supabase
      .from('questions')
      .select('id, topic_id, question, question_number')
      .limit(5)

    // Test relationship query - try to find questions for first topic
    let relationshipTest = null
    if (sampleTopics && sampleTopics.length > 0) {
      const firstTopic = sampleTopics[0]
      const { data: relatedQuestions, error: relationshipError } = await supabase
        .from('questions')
        .select('id, question, question_number')
        .eq('topic_id', firstTopic.topic_id)
        .limit(3)

      relationshipTest = {
        topic: firstTopic,
        questions: relatedQuestions || [],
        error: relationshipError
      }
    }

    // Check for common issues
    const diagnostics = {
      database_health: {
        topics_count: topicsCount,
        questions_count: questionsCount,
        topics_count_error: topicsCountError,
        questions_count_error: questionsCountError
      },
      sample_data: {
        topics: sampleTopics || [],
        questions: sampleQuestions || [],
        topics_error: sampleTopicsError,
        questions_error: sampleQuestionsError
      },
      relationship_test: relationshipTest,
      potential_issues: {
        no_topics: topicsCount === 0,
        no_questions: questionsCount === 0,
        count_mismatch: questionsCount === 1000, // Indicates possible limit issue
        relationship_broken: relationshipTest && relationshipTest.questions.length === 0
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      diagnostics
    })

  } catch (error) {
    console.error('Database diagnostic error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
} 