import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// Simple in-memory cache for categories
let categoriesCache: {
  data: any[] | null
  timestamp: number
} | null = null

const CACHE_DURATION = 3600000 // 1 hour cache for categories (they rarely change)

export async function GET() {
  try {
    // Check cache first
    const now = Date.now()
    if (categoriesCache && (now - categoriesCache.timestamp) < CACHE_DURATION) {
      console.log('🔍 Using cached categories data')
      return NextResponse.json({
        success: true,
        categories: categoriesCache.data,
        cached: true,
        debug: {
          totalCount: categoriesCache.data?.length || 0,
          activeOnly: true,
          orderedBy: 'display_order',
          cacheAge: Math.round((now - categoriesCache.timestamp) / 1000)
        }
      })
    }

    console.log('🔍 Fetching categories from database...')

    // Get categories from the actual categories table
    const { data: categories, error } = await supabase
      .from('categories')
      .select('id, name, emoji, description, display_order, is_active')
      .eq('is_active', true)
      .order('display_order', { ascending: true })

    if (error) {
      console.error('❌ Categories error:', error)
      return NextResponse.json(
        { 
          success: false,
          error: 'Failed to fetch categories',
          details: error.message 
        },
        { status: 500 }
      )
    }

    console.log(`✅ Found ${categories?.length || 0} categories`)

    // Transform categories to match the expected frontend format
    const transformedCategories = (categories || []).map(category => ({
      id: category.id,
      name: category.name,
      emoji: category.emoji,
      description: category.description,
      display_order: category.display_order
    }))

    // Cache the transformed data
    categoriesCache = {
      data: transformedCategories,
      timestamp: now
    }

    return NextResponse.json({
      success: true,
      categories: transformedCategories,
      cached: false,
      debug: {
        totalCount: categories?.length || 0,
        activeOnly: true,
        orderedBy: 'display_order'
      }
    })
  } catch (error) {
    console.error('❌ API error:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch categories',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
} 