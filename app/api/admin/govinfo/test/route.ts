import { NextRequest, NextResponse } from 'next/server'
import { GovInfoAPIClient } from '@/lib/integrations/govinfo-api'

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 Testing GovInfo API connection...')
    
    const govInfoAPI = new GovInfoAPIClient()
    
    // Validate the connection
    const validation = await govInfoAPI.validateConnection()
    
    if (validation.success) {
      console.log('✅ GovInfo API test successful')
      
      // Try a simple search to verify functionality
      try {
        const testSearch = await govInfoAPI.searchHearings({
          pageSize: 1,
          offset: 0
        })
        
        return NextResponse.json({
          success: true,
          message: 'GovInfo API is working correctly',
          validation,
          testSearch: {
            found: testSearch?.packages?.length || 0,
            sample: testSearch?.packages?.[0] || null
          }
        })
      } catch (searchError) {
        return NextResponse.json({
          success: false,
          message: 'API connection works but search failed',
          validation,
          searchError: searchError instanceof Error ? searchError.message : 'Unknown search error'
        })
      }
    } else {
      console.error('❌ GovInfo API test failed:', validation.message)
      return NextResponse.json({
        success: false,
        message: validation.message,
        validation
      }, { status: 400 })
    }
  } catch (error) {
    console.error('GovInfo API test error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to test GovInfo API connection'
    }, { status: 500 })
  }
} 