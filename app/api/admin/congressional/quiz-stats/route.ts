import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/admin-access'

export async function GET(request: NextRequest) {
  try {
    // Check admin authentication
    const adminCheck = await requireAdmin(request);
    if (!adminCheck.success) {
      return adminCheck.response!;
    }
    
    console.log('🧠 Fetching quiz generation statistics...')

    const supabase = await createClient()
    
    const quizStats = {
      total_topics_generated: 0,
      total_questions_generated: 0,
      bills_processed: 0,
      hearings_processed: 0,
      committee_docs_processed: 0,
      avg_questions_per_topic: 0,
      last_generation: null as string | null
    }

    // Get total topics generated from congressional documents
    const { data: topics, error: topicsError } = await supabase
      .from('question_topics')
      .select('id, created_at')
      .eq('ai_generated', true)

    if (!topicsError && topics) {
      quizStats.total_topics_generated = topics.length

      // Get last generation time
      if (topics.length > 0) {
        const sortedTopics = topics.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
        quizStats.last_generation = sortedTopics[0].created_at
      }
    }

    // Get total questions generated from congressional documents
    const { data: questions, error: questionsError } = await supabase
      .from('questions')
      .select('id, topic_id')
      .eq('ai_generated', true)
      .in('topic_id', topics?.map(t => t.id) || [])

    if (!questionsError && questions) {
      quizStats.total_questions_generated = questions.length

      // Calculate average questions per topic
      if (quizStats.total_topics_generated > 0) {
        quizStats.avg_questions_per_topic = quizStats.total_questions_generated / quizStats.total_topics_generated
      }
    }

    // Get processing counts from the quiz generation stats table (if it exists)
    const { data: generationStats, error: statsError } = await supabase
      .from('ai_quiz_generation_stats')
      .select('*')
      .order('last_generation', { ascending: false })
      .limit(1)
      .single()

    if (!statsError && generationStats) {
      quizStats.bills_processed = generationStats.bills_processed || 0
      quizStats.hearings_processed = generationStats.hearings_processed || 0
      quizStats.committee_docs_processed = generationStats.committee_docs_processed || 0
      
      if (generationStats.last_generation) {
        quizStats.last_generation = generationStats.last_generation
      }
    } else {
      // Fallback: count documents that have been processed for quiz generation
      const { data: processedBills } = await supabase
        .from('congressional_bills')
        .select('id')
        .eq('quiz_content_generated', true)

      const { data: processedHearings } = await supabase
        .from('congressional_hearings')
        .select('id')
        .eq('quiz_content_generated', true)

      const { data: processedDocs } = await supabase
        .from('congressional_committee_documents')
        .select('id')
        .eq('quiz_content_generated', true)

      quizStats.bills_processed = processedBills?.length || 0
      quizStats.hearings_processed = processedHearings?.length || 0
      quizStats.committee_docs_processed = processedDocs?.length || 0
    }

    console.log('✅ Quiz generation statistics fetched:', quizStats)

    return NextResponse.json({
      success: true,
      data: quizStats
    })

  } catch (error) {
    console.error('Error fetching quiz generation statistics:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
} 