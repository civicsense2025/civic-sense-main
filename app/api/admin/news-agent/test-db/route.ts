/**
 * Database Test Route for News Agent
 * 
 * Quick test to see what's in the source_metadata table
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    
    console.log('🔍 Testing database connection...')
    
    // Test source_metadata table
    const { data: sourceTest, error: sourceError } = await supabase
      .from('source_metadata')
      .select('id, title, domain, last_fetched_at, credibility_score')
      .limit(10)
    
    console.log('📊 Source metadata test result:', {
      count: sourceTest?.length || 0,
      error: sourceError?.message,
      sample: sourceTest?.slice(0, 3)
    })
    
    // Test distinct domains
    const { data: domains, error: domainError } = await supabase
      .from('source_metadata')
      .select('domain')
      .not('domain', 'is', null)
    
    const uniqueDomains = domains ? [...new Set(domains.map(d => d.domain))] : []
    
    console.log('🌐 Unique domains found:', uniqueDomains.length, uniqueDomains.slice(0, 10))
    
    // Test recent articles (last 24 hours)
    const { data: recentArticles, error: recentError } = await supabase
      .from('source_metadata')
      .select('id, title, domain, last_fetched_at')
      .gte('last_fetched_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .not('title', 'is', null)
    
    console.log('📰 Recent articles (24h):', {
      count: recentArticles?.length || 0,
      error: recentError?.message
    })
    
    return NextResponse.json({
      success: true,
      results: {
        totalSourceMetadata: sourceTest?.length || 0,
        uniqueDomains: uniqueDomains.length,
        domainsFound: uniqueDomains.slice(0, 10),
        recentArticles24h: recentArticles?.length || 0,
        sampleArticles: sourceTest?.slice(0, 3) || [],
        errors: {
          sourceError: sourceError?.message,
          domainError: domainError?.message,
          recentError: recentError?.message
        }
      }
    })
    
  } catch (error) {
    console.error('❌ Database test failed:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
} 