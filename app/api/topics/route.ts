import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit');
    const offset = searchParams.get('offset') || '0';
    
    // First get the total count
    const { count: totalCount, error: countError } = await supabase
      .from('question_topics')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);

    if (countError) {
      console.error('Error getting topics count:', countError);
    }

    // Build the query
    let query = supabase
      .from('question_topics')
      .select('topic_id, topic_title, description, emoji, date, categories')
      .eq('is_active', true)
      .order('topic_title', { ascending: true });

    // Apply limit and offset if not loading all
    if (limit !== 'all') {
      const limitNum = parseInt(limit || '100');
      const offsetNum = parseInt(offset);
      query = query.range(offsetNum, offsetNum + limitNum - 1);
    }

    const { data: topics, error } = await query;

    if (error) {
      console.error('Error fetching topics:', error)
      return NextResponse.json({ 
        topics: [], 
        total: 0,
        hasMore: false 
      })
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

    const currentOffset = parseInt(offset);
    const currentLimit = limit === 'all' ? formattedTopics.length : parseInt(limit || '100');
    const hasMore = limit !== 'all' && formattedTopics.length === currentLimit && (currentOffset + currentLimit) < (totalCount || 0);

    return NextResponse.json({ 
      topics: formattedTopics,
      total: totalCount || formattedTopics.length,
      hasMore,
      offset: currentOffset,
      limit: limit === 'all' ? 'all' : currentLimit
    })
  } catch (error) {
    console.error('Error in topics API route:', error)
    
    // Return empty array on error
    return NextResponse.json({ 
      topics: [], 
      total: 0,
      hasMore: false 
    })
  }
} 