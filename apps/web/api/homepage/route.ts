import { NextRequest, NextResponse } from 'next/server'
import { dataService } from '@civicsense/shared/lib/data-service'
import { enhancedQuizDatabase } from '@civicsense/shared/lib/quiz-database'
import { createClient } from '@civicsense/shared/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const includeCalendar = searchParams.get('includeCalendar') === 'true'
    
    // Get user from auth
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    // Batch all data fetching into parallel promises
    const promises: Promise<any>[] = []
    
    // Always fetch categories (needed for both views)
    promises.push(dataService.getCachedCategories())
    
    // Only fetch user-specific data if user exists
    if (user?.id) {
      promises.push(enhancedQuizDatabase.getUserQuizAttempts(user.id))
    } else {
      promises.push(Promise.resolve([]))
    }
    
    // Only fetch calendar topics if needed
    if (includeCalendar) {
      promises.push(dataService.getAllTopics())
    } else {
      promises.push(Promise.resolve({}))
    }
    
    const [categories, userAttempts, allTopics] = await Promise.all(promises)
    
    // Process incomplete attempts
    let incompleteAttempts: any[] = []
    let incompleteTopics: any[] = []
    
    if (user?.id && userAttempts?.length > 0) {
      // Filter incomplete attempts
      const incomplete = userAttempts.filter((a: any) => a.isPartial)
      incompleteAttempts = incomplete
      
      // Batch fetch topic metadata for incomplete attempts
      if (incomplete.length > 0) {
        const topicPromises = incomplete.map((a: any) => dataService.getTopicById(a.topicId))
        incompleteTopics = (await Promise.all(topicPromises)).filter(Boolean)
      }
    }
    
    const responseData = {
      incompleteAttempts,
      incompleteTopics,
      categories: categories.slice(0, 6), // Limit to 6 for performance
      topicsForCalendar: includeCalendar ? Object.values(allTopics) : undefined,
      timestamp: new Date().toISOString()
    }
    
    return NextResponse.json({
      success: true,
      data: responseData
    })
  } catch (error) {
    console.error('Homepage API error:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch homepage data',
        data: {
          incompleteAttempts: [],
          incompleteTopics: [],
          categories: [],
          topicsForCalendar: undefined
        }
      },
      { status: 500 }
    )
  }
} 