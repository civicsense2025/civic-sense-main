import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/admin-access'

/**
 * Categories API - Get all available categories from database content
 * 
 * This endpoint analyzes existing content to extract all categories used
 * across question topics, events, and other content types.
 * NOW USING REAL DATABASE DATA ONLY - NO HARDCODED FALLBACKS
 */

export async function GET(request: NextRequest) {
  try {
    const adminCheck = await requireAdmin(request)
    if (!adminCheck.success || adminCheck.response) {
      return adminCheck.response || NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const { user } = adminCheck
    console.log(`✅ Admin user ${user.email} accessing categories API`)

    const supabase = await createClient()
    
    // Collect categories from multiple sources - REAL DATA ONLY
    const categorySet = new Set<string>()
    const sourceCounts = {
      question_topics: 0,
      events: 0,
      questions: 0,
      total_records_analyzed: 0
    }
    
    // 1. Get categories from question_topics - NO LIMIT, GET ALL
    try {
      console.log('🔍 Querying question_topics for categories...')
      const { data: topics, error: topicsError } = await supabase
        .from('question_topics')
        .select('categories, topic_id')
        .not('categories', 'is', null)
        // REMOVED .limit() - get all data
      
      if (!topicsError && topics) {
        console.log(`📊 Found ${topics.length} question topics with categories`)
        sourceCounts.question_topics = topics.length
        sourceCounts.total_records_analyzed += topics.length
        
        topics.forEach(topic => {
          if (Array.isArray(topic.categories)) {
            topic.categories.forEach(cat => {
              if (cat && typeof cat === 'string' && cat.trim()) {
                categorySet.add(cat.trim())
              }
            })
          }
        })
      } else if (topicsError) {
        console.warn('Error loading categories from question_topics:', topicsError)
      }
    } catch (error) {
      console.warn('Error loading categories from question_topics:', error)
    }

    // 2. Get categories from events table - NO LIMIT, GET ALL
    try {
      console.log('🔍 Querying events for categories...')
      const { data: events, error: eventsError } = await supabase
        .from('events')
        .select('categories, topic_id')
        .not('categories', 'is', null)
        // REMOVED .limit() - get all data
      
      if (!eventsError && events) {
        console.log(`📊 Found ${events.length} events with categories`)
        sourceCounts.events = events.length
        sourceCounts.total_records_analyzed += events.length
        
        events.forEach(event => {
          if (Array.isArray(event.categories)) {
            event.categories.forEach(cat => {
              if (cat && typeof cat === 'string' && cat.trim()) {
                categorySet.add(cat.trim())
              }
            })
          }
        })
      } else if (eventsError) {
        console.warn('Error loading categories from events:', eventsError)
      }
    } catch (error) {
      console.warn('Error loading categories from events:', error)
    }

    // 3. Get categories from questions table - NO LIMIT, GET ALL
    try {
      console.log('🔍 Querying questions for categories...')
      const { data: questions, error: questionsError } = await supabase
        .from('questions')
        .select('category, id')
        .not('category', 'is', null)
        // REMOVED .limit() - get all data
      
      if (!questionsError && questions) {
        console.log(`📊 Found ${questions.length} questions with categories`)
        sourceCounts.questions = questions.length
        sourceCounts.total_records_analyzed += questions.length
        
        questions.forEach(question => {
          if (question.category && typeof question.category === 'string' && question.category.trim()) {
            categorySet.add(question.category.trim())
          }
        })
      } else if (questionsError) {
        console.warn('Error loading categories from questions:', questionsError)
      }
    } catch (error) {
      console.warn('Error loading categories from questions:', error)
    }

    // Convert to sorted array - ONLY REAL DATABASE CATEGORIES
    const categories = Array.from(categorySet).sort()

    console.log(`✅ REAL CATEGORIES ANALYSIS COMPLETE:`)
    console.log(`   - Found ${categories.length} unique real categories`)
    console.log(`   - From ${sourceCounts.total_records_analyzed} total database records`)
    console.log(`   - Sources: ${sourceCounts.question_topics} topics, ${sourceCounts.events} events, ${sourceCounts.questions} questions`)
    console.log(`   - NO HARDCODED FALLBACKS ADDED`)

    return NextResponse.json({
      success: true,
      categories,
      count: categories.length,
      sources: {
        total_records_analyzed: sourceCounts.total_records_analyzed,
        question_topics_with_categories: sourceCounts.question_topics,
        events_with_categories: sourceCounts.events,
        questions_with_categories: sourceCounts.questions,
        // NO MORE HARDCODED FALLBACKS
        note: 'This now shows ONLY real categories from your database - no hardcoded fallbacks'
      },
      database_reality: {
        all_categories_are_real: true,
        hardcoded_fallbacks_removed: true,
        can_trust_gap_analysis: categories.length > 10
      }
    })

  } catch (error) {
    console.error('Error in categories API:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 