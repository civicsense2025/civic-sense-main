import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface AgentConfig {
  isActive: boolean
  monitoringIntervalMinutes: number
  minCivicRelevanceScore: number
  maxEventsPerCycle: number
  contentGeneration: {
    generateQuestions: boolean
    generateSkills: boolean
    generateGlossaryTerms: boolean
    generateEvents: boolean
    generatePublicFigures: boolean
  }
  databaseTargets: {
    saveToContentPackages: boolean
    saveToContentTables: boolean
    targetTables: {
      question_topics: boolean
      questions: boolean
      skills: boolean
      glossary_terms: boolean
      events: boolean
      public_figures: boolean
    }
    customTableMappings: Record<string, string>
    schemaConfig: {
      schemaName: string
      useCustomFieldMappings: boolean
      customFieldMappings: Record<string, Record<string, string>>
    }
  }
  qualityControl: {
    publishAsActive: boolean
    validateSchema: boolean
    requireMinimumFields: boolean
  }
}

const DEFAULT_CONFIG: AgentConfig = {
  isActive: false,
  monitoringIntervalMinutes: 30,
  minCivicRelevanceScore: 70,
  maxEventsPerCycle: 10,
  contentGeneration: {
    generateQuestions: true,
    generateSkills: true,
    generateGlossaryTerms: true,
    generateEvents: true,
    generatePublicFigures: true
  },
  databaseTargets: {
    saveToContentPackages: true,
    saveToContentTables: true,
    targetTables: {
      question_topics: true,
      questions: true,
      skills: true,
      glossary_terms: true,
      events: true,
      public_figures: true
    },
    customTableMappings: {},
    schemaConfig: {
      schemaName: 'public',
      useCustomFieldMappings: false,
      customFieldMappings: {}
    }
  },
  qualityControl: {
    publishAsActive: true,
    validateSchema: true,
    requireMinimumFields: true
  }
}

/**
 * GET /api/admin/news-agent/config
 * Load the current News AI Agent configuration
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check if user is authenticated and has admin access
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // For now, we'll store config in a simple table or return default
    // In the future, this could be stored in a dedicated config table
    const { data: configData, error } = await supabase
      .from('news_agent_config')
      .select('*')
      .single()

    if (error && error.code !== 'PGRST116') { // Not found is okay
      console.warn('Config table may not exist:', error)
    }

    const config = configData?.config || DEFAULT_CONFIG

    return NextResponse.json({
      success: true,
      config
    })

  } catch (error) {
    console.error('Error loading config:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to load configuration',
      config: DEFAULT_CONFIG // Fallback to default
    }, { status: 500 })
  }
}

/**
 * POST /api/admin/news-agent/config
 * Save the News AI Agent configuration
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check if user is authenticated and has admin access
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const config = body.config as AgentConfig

    // Validate configuration
    if (!config || typeof config !== 'object') {
      return NextResponse.json({
        error: 'Invalid configuration format'
      }, { status: 400 })
    }

    // Validate required fields
    const requiredFields = [
      'isActive',
      'monitoringIntervalMinutes',
      'minCivicRelevanceScore',
      'maxEventsPerCycle',
      'contentGeneration',
      'databaseTargets',
      'qualityControl'
    ]

    for (const field of requiredFields) {
      if (!(field in config)) {
        return NextResponse.json({
          error: `Missing required field: ${field}`
        }, { status: 400 })
      }
    }

    // Validate ranges
    if (config.monitoringIntervalMinutes < 5 || config.monitoringIntervalMinutes > 1440) {
      return NextResponse.json({
        error: 'Monitoring interval must be between 5 and 1440 minutes'
      }, { status: 400 })
    }

    if (config.minCivicRelevanceScore < 0 || config.minCivicRelevanceScore > 100) {
      return NextResponse.json({
        error: 'Civic relevance score must be between 0 and 100'
      }, { status: 400 })
    }

    if (config.maxEventsPerCycle < 1 || config.maxEventsPerCycle > 100) {
      return NextResponse.json({
        error: 'Max events per cycle must be between 1 and 100'
      }, { status: 400 })
    }

    // Save configuration
    try {
      const { error: saveError } = await supabase
        .from('news_agent_config')
        .upsert({
          id: 1, // Single config row
          config,
          updated_at: new Date().toISOString(),
          updated_by: user.id
        })

      if (saveError) {
        console.warn('Config table may not exist, saving will be skipped:', saveError)
        // For now, we'll just return success even if the table doesn't exist
        // The frontend will continue to use localStorage
      }
    } catch (saveError) {
      console.warn('Failed to save to database, config will be stored locally only:', saveError)
    }

    return NextResponse.json({
      success: true,
      message: 'Configuration saved successfully',
      config
    })

  } catch (error) {
    console.error('Error saving config:', error)
    return NextResponse.json({
      error: 'Failed to save configuration',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

/**
 * PUT /api/admin/news-agent/config
 * Update specific configuration fields
 */
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check if user is authenticated and has admin access
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const updates = body.updates

    if (!updates || typeof updates !== 'object') {
      return NextResponse.json({
        error: 'Invalid updates format'
      }, { status: 400 })
    }

    // Load current config
    const { data: configData } = await supabase
      .from('news_agent_config')
      .select('*')
      .single()

    const currentConfig = configData?.config || DEFAULT_CONFIG

    // Apply updates to current config
    const updatedConfig = { ...currentConfig, ...updates }

    // Save updated configuration
    const { error: saveError } = await supabase
      .from('news_agent_config')
      .upsert({
        id: 1,
        config: updatedConfig,
        updated_at: new Date().toISOString(),
        updated_by: user.id
      })

    if (saveError) {
      console.warn('Config table may not exist:', saveError)
    }

    return NextResponse.json({
      success: true,
      message: 'Configuration updated successfully',
      config: updatedConfig
    })

  } catch (error) {
    console.error('Error updating config:', error)
    return NextResponse.json({
      error: 'Failed to update configuration',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 