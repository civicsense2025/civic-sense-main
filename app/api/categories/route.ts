import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://example.supabase.co",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "example-anon-key"
)

export async function GET(request: Request) {
  try {
    // Check if we have valid environment variables
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.warn('Supabase environment variables not configured, returning mock data')
      return NextResponse.json({ 
        categories: [], 
        synonyms: [],
        error: 'Database not configured'
      })
    }

    const { searchParams } = new URL(request.url)
    const trending = searchParams.get('trending') === 'true'

    // Get canonical categories
    const { data: categories, error: categoriesError } = await supabase
      .from('categories')
      .select('id, name, emoji, description, display_order')
      .eq('is_active', true)
      .order('display_order')

    if (categoriesError) {
      console.error('Error fetching categories:', categoriesError)
      return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 })
    }

    let sortedCategories = categories || []

    if (trending && sortedCategories.length > 0) {
      // Get trending categories based on recent quiz activity
      const trendingCategories = await getTrendingCategories(sortedCategories)
      
      // Use trending categories if we have them, otherwise fall back to display order
      if (trendingCategories.length > 0) {
        sortedCategories = trendingCategories
      }
    }

    // Get category synonyms
    const { data: synonyms, error: synonymsError } = await supabase
      .from('category_synonyms')
      .select('alias, category_id')

    if (synonymsError) {
      console.error('Error fetching synonyms:', synonymsError)
      return NextResponse.json({ error: 'Failed to fetch synonyms' }, { status: 500 })
    }

    return NextResponse.json({ 
      categories: sortedCategories, 
      synonyms: synonyms || [],
      trending: trending 
    })
  } catch (error) {
    console.error('Unexpected error in categories API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

interface CategoryType {
  id: string
  name: string
  emoji: string
  description: string | null
  display_order: number | null
}

async function getTrendingCategories(allCategories: CategoryType[]): Promise<CategoryType[]> {
  try {
    // Get quiz attempts from the last 30 days
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    // First get recent quiz attempts
    const { data: recentAttempts, error: attemptsError } = await supabase
      .from('user_quiz_attempts')
      .select('topic_id, completed_at')
      .gte('completed_at', thirtyDaysAgo.toISOString())
      .eq('is_completed', true)

    if (attemptsError || !recentAttempts) {
      console.warn('Could not fetch recent quiz attempts for trending:', attemptsError)
      return []
    }

    // Get unique topic IDs from attempts
    const topicIds = Array.from(new Set(recentAttempts.map(attempt => attempt.topic_id)))
    
    if (topicIds.length === 0) {
      return []
    }

    // Get the categories for these topics
    const { data: topics, error: topicsError } = await supabase
      .from('question_topics')
      .select('topic_id, categories')
      .in('topic_id', topicIds)
      .eq('is_active', true)

    if (topicsError || !topics) {
      console.warn('Could not fetch topics for trending:', topicsError)
      return []
    }

    // Count attempts per category
    const categoryAttempts = new Map<string, number>()
    
    // Create a map of topic_id to categories
    const topicCategoriesMap = new Map<string, string[]>()
    topics.forEach(topic => {
      try {
        let categories: string[] = []
        
        // Handle different JSON formats
        if (Array.isArray(topic.categories)) {
          categories = topic.categories
        } else if (typeof topic.categories === 'string') {
          try {
            categories = JSON.parse(topic.categories)
          } catch {
            categories = [topic.categories]
          }
        }
        
        topicCategoriesMap.set(topic.topic_id, categories)
      } catch (err) {
        console.warn('Error processing topic categories:', err)
      }
    })

    // Count attempts by category
    recentAttempts.forEach(attempt => {
      const categories = topicCategoriesMap.get(attempt.topic_id)
      if (categories) {
        categories.forEach(category => {
          if (typeof category === 'string') {
            const count = categoryAttempts.get(category) || 0
            categoryAttempts.set(category, count + 1)
          }
        })
      }
    })

    // Sort categories by attempt count and randomize ties
    const trendingCategoryNames = Array.from(categoryAttempts.entries())
      .sort((a, b) => {
        const countDiff = b[1] - a[1]
        // If counts are equal, randomize order
        if (countDiff === 0) {
          return Math.random() - 0.5
        }
        return countDiff
      })
      .map(([categoryName]) => categoryName)

    // Filter and reorder the categories based on trending data
    const trendingCategories: CategoryType[] = []
    const categoriesByName = new Map(
      allCategories.map(cat => [cat.name.toLowerCase(), cat])
    )

    // Add trending categories first
    for (const trendingName of trendingCategoryNames) {
      const category = categoriesByName.get(trendingName.toLowerCase())
      if (category && !trendingCategories.includes(category)) {
        trendingCategories.push(category)
      }
    }

    // Add remaining categories in random order as fallback
    const remainingCategories = allCategories.filter(
      cat => !trendingCategories.includes(cat)
    )
    
    // Shuffle remaining categories randomly
    for (let i = remainingCategories.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[remainingCategories[i], remainingCategories[j]] = [remainingCategories[j], remainingCategories[i]]
    }

    return [...trendingCategories, ...remainingCategories]
    
  } catch (error) {
    console.error('Error calculating trending categories:', error)
    return []
  }
} 