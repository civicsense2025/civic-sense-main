import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    // Get all active topics with basic information for search
    const { data: topics, error } = await supabase
      .from('question_topics')
      .select('topic_id, topic_title, description, emoji, date, categories')
      .eq('is_active', true)
      .order('topic_title', { ascending: true })
      .limit(100) // Limit for performance

    if (error) {
      console.error('Error fetching topics:', error)
      return NextResponse.json({ topics: [] })
    }

    // Format topics for search
    const formattedTopics = (topics || []).map(topic => ({
      topic_id: topic.topic_id,
      topic_title: topic.topic_title,
      description: topic.description || '',
      emoji: topic.emoji || '📚',
      date: topic.date,
      categories: Array.isArray(topic.categories) ? topic.categories as string[] : []
    }))

    return NextResponse.json({ topics: formattedTopics })
  } catch (error) {
    console.error('Error in topics API route:', error)
    
    // Return empty array on error
    return NextResponse.json({ topics: [] })
  }
} 